from typing import Union
from fastapi import FastAPI
import firebase_admin
from firebase_admin import firestore, credentials
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json

# Initialization of DB + API Server
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cred = credentials.Certificate("./kagi-demo-firebase-adminsdk-yy469-9ebf643ee2.json")
try:
    firebase_admin.initialize_app(cred)
except ValueError as e:
    print(e)
db = firestore.client()

# Defining data models

class FeedBase(BaseModel):
    title: str
    url: str
    content:str
    date:str
    author: str

class FeedList(BaseModel):
    name:str
    url:str
    data: list[FeedBase]

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/add_feed")
async def addFeed(data:FeedList):
    doc_ref=db.collection("feed").document()
    print(json.loads(data.model_dump_json()))
    doc_ref.set(json.loads(data.model_dump_json()))
    return data

@app.get("/get_all_feeds")
async def getAllFeeds():
    docs=(db.collection("feed").stream())
    arrayOfFeedObjects=[]
    for doc in docs:
        feedObject=doc.to_dict()
        arrayOfFeedObjects.append(feedObject)


    return arrayOfFeedObjects
