import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import path from "path";

// Initialize the embedding model
const embeddingModel = new GoogleGenerativeAIEmbeddings({
  apiKey:
    process.env.GEMINI_API_KEY || "AIzaSyBlob6YbAnKxRpBDJSFoOnMGdDcH2JdWg4",
  model: "embedding-001",
});

async function loadVectorStore(loadPath) {
  await fs.access(loadPath);
  try {
    const serializedData = await fs.readFile(loadPath, "utf-8");
    const parsedData = JSON.parse(serializedData);

    const documents = parsedData.map(
      (item) =>
        new Document({
          pageContent: item.pageContent,
          metadata: item.metadata,
        })
    );
    const embeddings = parsedData.map((item) => item.embedding);

    // Correctly reconstruct the vector store
    const vectorStore = new MemoryVectorStore(embeddingModel);
    await vectorStore.addVectors(embeddings, documents);
    return vectorStore;
  } catch (error) {
    console.error("\n❌ Error loading vector store:", error.message);
    return null;
  }
}

async function queryDataset(vectorStore, queryText) {
  const results = await vectorStore.similaritySearch(queryText, 5);
  console.log("\n=== Query Results ===");
  if (results.length === 0) {
    console.log("No results found.");
  }
  results.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} ---`);
    console.log("Text:", result.pageContent);
    console.log("Metadata:", result.metadata);
  });
  console.log("\nQuery completed.");
  return results;
}

async function ingestJSONFile(filePath, vectorStore) {
  let documents = [];
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    const records = Array.isArray(data) ? data : [data];

    // Embed each record into a Document
    for (const item of records) {
      const text =
        item.description || item.text || item.name || JSON.stringify(item);

      if (!text?.trim()) {
        console.log(`Skipping a document with no text`);
        continue;
      }

      const metadata = {};
      for (const key in item) {
        const value = item[key];
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          (Array.isArray(value) &&
            value.every((v) => typeof v === "string" || typeof v === "number"))
        ) {
          metadata[key] = value;
        }
      }

      documents.push(
        new Document({
          pageContent: text,
          metadata: {
            ...metadata,
            source: "dataset",
            filename: path.basename(filePath),
          },
        })
      );
    }

    await vectorStore.addDocuments(documents); // Add await as this is an async operation

    console.log(
      `✓ Successfully ingested ${documents.length} documents from ${filePath}.`
    );
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

async function saveVectorStore(vectorStore, savePath) {
  const serializedData = JSON.stringify(
    vectorStore.memoryVectors.map((mv) => ({
      pageContent: mv.pageContent,
      metadata: mv.metadata,
      embedding: mv.embedding,
    })),
    null,
    2
  );

  await fs.writeFile(savePath, serializedData);
}

async function initializeVectorStore(embeddings, datasetDir, savePath) {
  const vectorStore = new MemoryVectorStore(embeddings);

  const files = await fs.readdir(datasetDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(datasetDir, file);
      try {
        await ingestJSONFile(filePath, vectorStore);
        console.log(`Ingested ${file} successfully.`);
      } catch (err) {
        console.error(`Error ingesting ${file}:`, err.message);
        console.error(filePath);
      }
    }
  }
  await saveVectorStore(vectorStore, savePath);
  console.log(`✓ Successfully saved vector store to ${savePath}.`);
}

// Main execution flow
async function main() {
  const datasetDir = path.resolve("datasets/mauritius_attractions_dataset");
  const saveFilePath = path.resolve("vector_store.json");
  const query = "beaches in the north";

  // Check if the saved file exists
  try {
    // If it exists, load and query
    const vectorStore = await loadVectorStore(saveFilePath);
    await queryDataset(vectorStore, query);
  } catch (error) {
    // If it doesn't exist, ingest and save
    await initializeVectorStore(embeddingModel, datasetDir, saveFilePath);
    const vectorStore = await loadVectorStore(saveFilePath);
    await queryDataset(vectorStore, query);
  }
}

main().catch(console.error);
