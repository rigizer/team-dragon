from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class TimestampMixin:
    """생성 및 수정 시간 자동 추적 믹스인"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class User(Base, TimestampMixin):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    login_id = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # INSTRUCTOR | STUDENT

    # 관계 설정
    tracks = relationship("CourseTrack", back_populates="instructor", cascade="all, delete-orphan")
    projects = relationship("StudentProject", back_populates="student", cascade="all, delete-orphan")

class InstructorStudentRelation(Base, TimestampMixin):
    __tablename__ = "instructor_student_relation"

    id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("instructor_id", "student_id"),
    )

class CourseTrack(Base, TimestampMixin):
    __tablename__ = "course_track"

    id = Column(Integer, primary_key=True)
    instructor_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    domain_type = Column(String(100), nullable=False)

    instructor = relationship("User", back_populates="tracks")
    materials = relationship("CourseMaterial", back_populates="track", cascade="all, delete-orphan")
    criteria = relationship("EvaluationCriterion", back_populates="track", cascade="all, delete-orphan")
    projects = relationship("StudentProject", back_populates="track", cascade="all, delete-orphan")

class CourseMaterial(Base, TimestampMixin):
    __tablename__ = "course_material"

    id = Column(Integer, primary_key=True)
    track_id = Column(Integer, ForeignKey("course_track.id", ondelete="CASCADE"), nullable=False)
    material_type = Column(String(100))  # 강의자료 | 루브릭
    file_url = Column(Text, nullable=False)
    extracted_text = Column(Text)
    ocr_text = Column(Text)
    status = Column(String(50), default="uploaded")

    track = relationship("CourseTrack", back_populates="materials")

class EvaluationCriterion(Base, TimestampMixin):
    __tablename__ = "evaluation_criterion"

    id = Column(Integer, primary_key=True)
    track_id = Column(Integer, ForeignKey("course_track.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    source_refs = Column(Text)
    priority = Column(Integer)  # 1~5 우선순위
    flags = Column(String(50))  # 확신 여부 (확인 필요 등)
    score_scale = Column(Integer, default=5)
    status = Column(String(50), default="draft")  # draft | approved

    track = relationship("CourseTrack", back_populates="criteria")
    evaluations = relationship("InstructorEvaluation", back_populates="criterion", cascade="all, delete-orphan")

class StudentProject(Base, TimestampMixin):
    __tablename__ = "student_project"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(Integer, ForeignKey("course_track.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    project_pdf_url = Column(Text, nullable=False)
    extracted_image_url = Column(Text)
    extracted_text = Column(Text)
    ocr_text = Column(Text)
    status = Column(String(50), default="uploaded")

    student = relationship("User", back_populates="projects")
    track = relationship("CourseTrack", back_populates="projects")
    contributions = relationship("ContributionFrom", back_populates="project", cascade="all, delete-orphan")
    employment_pack = relationship("EmploymentPack", uselist=False, back_populates="project", cascade="all, delete-orphan")

class ContributionFrom(Base, TimestampMixin):
    __tablename__ = "contribution_from"

    id = Column(Integer, primary_key=True)
    student_project_id = Column(Integer, ForeignKey("student_project.id", ondelete="CASCADE"), nullable=False)
    student_role = Column(String(255))
    student_action = Column(Text)
    student_result = Column(Text)
    scope_type = Column(String(50), nullable=False)  # team | individual
    status = Column(String(50), default="draft")

    project = relationship("StudentProject", back_populates="contributions")
    skills = relationship("ContributionSkill", back_populates="contribution", cascade="all, delete-orphan")


class ContributionSkill(Base, TimestampMixin):
    __tablename__ = "contribution_skill"

    id = Column(Integer, primary_key=True)
    contribution_id = Column(Integer, ForeignKey("contribution_from.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)

    __table_args__ = (
        UniqueConstraint("contribution_id", "skill_name"),
    )

    contribution = relationship("ContributionFrom", back_populates="skills")

class InstructorEvaluation(Base, TimestampMixin):
    __tablename__ = "instructor_evaluation"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("evaluation_criterion.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer)  # 1~5점 점수
    comment = Column(Text)
    status = Column(String(50), default="pending")  # pending | scored

    __table_args__ = (
        UniqueConstraint("student_id", "criterion_id"),
    )

    criterion = relationship("EvaluationCriterion", back_populates="evaluations")

class EmploymentPack(Base, TimestampMixin):
    __tablename__ = "employment_pack"

    id = Column(Integer, primary_key=True)
    student_project_id = Column(Integer, ForeignKey("student_project.id", ondelete="CASCADE"), unique=True, nullable=False)
    md_file_url = Column(Text)
    portfolio_file_url = Column(Text)
    portfolio_summary_text = Column(Text)
    submission_pack_text = Column(Text)
    status = Column(String(50), default="provisional")

    project = relationship("StudentProject", back_populates="employment_pack")
    role_fits = relationship("RoleFit", back_populates="pack", cascade="all, delete-orphan")

class RoleFit(Base, TimestampMixin):
    __tablename__ = "role_fit"

    id = Column(Integer, primary_key=True)
    employment_pack_id = Column(Integer, ForeignKey("employment_pack.id", ondelete="CASCADE"), nullable=False)
    role_name = Column(String(255), nullable=False)
    fit_reason = Column(Text)
    missing_points = Column(Text)

    pack = relationship("EmploymentPack", back_populates="role_fits")
