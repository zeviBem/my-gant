import "./App.css";
import { Gantt } from "./gantt";
import { sampleTasks } from "./gantt/data/tasks";

function App() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Project Timeline</h2>
      <Gantt tasks={sampleTasks} />
    </div>
  );
}

export default App;
