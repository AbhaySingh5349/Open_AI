const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

const pineconeIdx = process.env.PINECONE_INDEX;
const pineconeNamespace = process.env.PINECONE_NAMESPACE;
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;

const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
  environment: pineconeEnvironment,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

const start = async () => {
  const index = await pinecone.Index(pineconeIdx); // upserting or fetching data from this index
};

start();
