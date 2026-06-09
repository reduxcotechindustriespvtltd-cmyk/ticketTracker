"""Run: python -m backend.scripts.create_admin"""
import sys
import bcrypt
from backend.database import SessionLocal
from backend.models import User


def create_admin(email: str, password: str):
    db = SessionLocal()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"User {email} already exists")
        return

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(email=email, password_hash=hashed, role="admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Admin user created: {email} (id={user.id})")
    db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.scripts.create_admin <email> <password>")
        sys.exit(1)
    create_admin(sys.argv[1], sys.argv[2])
