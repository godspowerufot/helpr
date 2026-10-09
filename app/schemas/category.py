from pydantic import BaseModel


class CategoryPublic(BaseModel):
    id: int
    slug: str
    name: str


class CategoryRef(BaseModel):
    slug: str
    name: str
