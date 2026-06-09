"""Run: python -m backend.scripts.create_admin <email> <password>"""
import sys
import asyncio
import bcrypt


async def create_admin(email: str, password: str):
    from backend.database import init_db
    from backend.models import User

    await init_db()

    existing = await User.find_one(User.email == email)
    if existing:
        print(f"User {email} already exists")
        return

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    user = User(email=email, password_hash=hashed, role="admin")
    await user.insert()
    print(f"Admin user created: {email} (id={user.id})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.scripts.create_admin <email> <password>")
        sys.exit(1)
    asyncio.run(create_admin(sys.argv[1], sys.argv[2]))
