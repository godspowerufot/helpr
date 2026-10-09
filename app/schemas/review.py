from datetime import datetime

from pydantic import BaseModel, Field


class ReviewPublic(BaseModel):
    id: int
    booking_id: int
    listing_id: int
    rating: int
    comment: str
    customer_name: str
    created_at: datetime


class ReviewList(BaseModel):
    items: list[ReviewPublic]
    total: int


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)
