from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: str
    created_at: datetime
    token_balance: int = 100


class UserInDB(User):
    hashed_password: str


class UserResponse(User):
    pass


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenBalanceResponse(BaseModel):
    balance: int


class ConsumeTokensRequest(BaseModel):
    amount: int = Field(..., gt=0)
