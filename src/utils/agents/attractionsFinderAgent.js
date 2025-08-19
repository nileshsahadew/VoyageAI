const { Annotation } = require("@langchain/langgraph");

const AgentState = Annotation.Root({
  queries: Annotation,
  iteneraryOutput: Annotation,
});
