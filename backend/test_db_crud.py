import os
import sys

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.getcwd())

from sqlalchemy import select
from app.db.database import SessionLocal, engine
from app.db.models import User, Base

def test_db_operation():
    print("--- DB CRUD 테스트 시작 ---")
    session = SessionLocal()
    try:
        # 1. 더미 사용자 생성
        test_user = User(
            login_id="test_dragon",
            password="hashed_password",
            name="테스트용드래곤",
            role="INSTRUCTOR"
        )
        session.add(test_user)
        session.commit()
        print(f"1. 사용자 생성 완료: {test_user.name} (ID: {test_user.id})")

        # 2. 사용자 조회
        query = select(User).where(User.login_id == "test_dragon")
        db_user = session.execute(query).scalar_one_or_none()
        if db_user:
            print(f"2. 사용자 조회 성공: {db_user.name}")
        else:
            print("2. 사용자 조회 실패")
            return

        # 3. 사용자 수정
        db_user.name = "수정된드래곤"
        session.commit()
        print(f"3. 사용자 수정 완료: {db_user.name}")

        # 4. 사용자 삭제
        session.delete(db_user)
        session.commit()
        print("4. 사용자 삭제 완료")

        # 5. 최종 확인
        final_user = session.execute(query).scalar_one_or_none()
        if final_user is None:
            print("5. 데이터 클린업 확인 완료")
            print("\n--- 모든 DB 테스트 성공! ---")
        else:
            print("5. 데이터 클린업 실패")

    except Exception as e:
        print(f"에러 발생: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    test_db_operation()
