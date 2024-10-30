from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

from pydantic import BaseModel, validator
from typing import List
class GraphBase(BaseModel):
    start: str
    end: str
    distance: int

class GraphList(BaseModel):
    data: List[GraphBase]

@app.post("/dummypath")
async def get_body(data: GraphList):
    return data
