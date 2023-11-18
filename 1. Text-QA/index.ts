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

  // modifying text file
  await modifyInputFile();
};

start();

const readText = async (isClean = false) => {
  let txt = '';
  if (isClean) {
    txt = fs.readFileSync('./cleaned_wikipedia.txt', 'utf-8');
  } else {
    txt = fs.readFileSync('./wikipedia.txt', 'utf-8');
  }

  // console.log('text: ', txt);
  return txt;
};

const cleanText = async () => {
  const txt = await readText();

  const lines = txt.split('\n');
  let cleanedLines = lines.map((line) => {
    const cleanedLine = line.replace(/[^a-zA-Z ]/g, ''); // replace non-chars with ''
    return cleanedLine;
  });

  cleanedLines = cleanedLines.filter((line) => line.length > 0); // removing empty strings
  fs.writeFileSync('./cleaned_wikipedia.txt', cleanedLines.join('\n'));
};

async function modifyInputFile() {
  await cleanText();
}
