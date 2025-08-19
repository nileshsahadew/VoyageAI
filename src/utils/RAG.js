import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import path from "path";
import { embeddingModel } from "../llms.js"; // Import the embedding model

export async function loadVectorStore(loadPath) {
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

export async function queryDataset(vectorStore, queryText) {
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

export async function ingestJSONFile(filePath, vectorStore) {
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
        // Check if the value is not a null or undefined
        if (value !== null && typeof value !== "undefined") {
          // Check if the value is a nested object that is not an array.
          if (typeof value === "object" && !Array.isArray(value)) {
            // Stringify the nested object to preserve it
            metadata[key] = JSON.stringify(value);
          } else {
            // For simple types and arrays, add them directly
            metadata[key] = value;
          }
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

export async function saveVectorStore(vectorStore, savePath) {
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

export async function initializeVectorStore(embeddings, datasetDir, savePath) {
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
