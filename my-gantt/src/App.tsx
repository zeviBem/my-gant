import "./App.css";
import { Gantt } from "./gantt";
import { sampleCategories, sampleTasks } from "./gantt/data/tasks";

function App() {
  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <h2 style={{ flex: "none" }}>Project Timeline</h2>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Gantt tasks={sampleTasks} categories={sampleCategories} />
      </div>
    </div>
  );
}

export default App;
