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

type PineconeMetadata = {
  text: string;
};

const start = async () => {
  // const index = await pinecone.index<PineconeMetadata>(pineconeIdx);

  const index = await pinecone.index(pineconeIdx); // upserting or fetching data from this index

  // STEP-1 (modifying text file)

  // await modifyInputFile();

  // STEP-2 (generate vector embeddings for input)

  // const embeds = await createEmbeddingsForChunks();

  // STEP-3 (store embedding data in pinecone db)

  // await addDataToPineconeIndex({ index, embeds });

  // STEP-4 (ask question)

  const question = 'where was virat kohli born ?';
  const similarChunk = await getSimilarChunk(index, question);
  await createChatCompletion(similarChunk.matches[0].metadata.text, question);
};

start();

// ******************************************************************************************************************************************

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

// ******************************************************************************************************************************************

const createChunks = async () => {
  const wikiData = await readText(true);
  const lines = wikiData.split('\n');

  const chunks = [];

  for (let i = 0; i < lines.length; i += 2) {
    const chunk = lines.slice(i, i + 2); // each chunk contains 2 lines (to have semantic meaning in each chunk)
    chunks.push(chunk.join('\n'));
  }

  // console.log(chunks.length, ' => chunks: ', chunks);
  return chunks;
};

// wrapper for openai function i.e we will be passing chunks to it.
const createEmbeddings = async (text: string) => {
  const config = {
    model: 'text-embedding-ada-002',
    input: text,
  };

  const response = await openai.embeddings.create(config);
  return response;
};

async function createEmbeddingsForChunks() {
  const chunks = await createChunks();

  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await createEmbeddings(chunk);

    embeddings.push({
      text: chunk,
      embedding: embedding.data[0].embedding,
    });
  }

  // console.dir({ embeddings }, { depth: null });
  return embeddings;
}

// ******************************************************************************************************************************************

interface AddDataToPineconeParams {
  index: any;
  embeds: {
    text: string;
    embedding: number[];
  }[];
}

async function addDataToPineconeIndex(params: AddDataToPineconeParams) {
  const { index, embeds } = params;
  const configs = [];

  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i];

    configs.push({
      id: `vec_${i}`,
      values: embed.embedding,
      metadata: { text: embed.text },
    });
  }

  await index.upsert(configs);
}

// ******************************************************************************************************************************************

async function getSimilarChunk(index: any, question: string) {
  const questionEmbedding = await createEmbeddings(question);
  const queryOptions = {
    topK: 3,
    vector: questionEmbedding.data[0].embedding,
    includeMetadata: true,
    includeValues: false,
  };

  const results = await index.query(queryOptions);

  // console.dir({ similarChunk: results }, { depth: null });
  return results;
}

// to give to the point answer
async function createChatCompletion(content: string, question: string) {
  const config = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant, answer user questions based on content below. Don't respond if question is not related to following content \n\n ${content}`,
      },
      {
        role: 'user',
        content: question,
      },
    ],
  };

  const response = await openai.chat.completions.create(config);

  console.dir(
    { response: response.choices[0].message.content },
    { depth: null }
  );
  return response;
}
