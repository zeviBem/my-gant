import "./App.css";
import { GanttPage } from "./gantt";
import { sampleCategories, sampleTasks } from "./gantt/data/tasks";

function App() {
  return <GanttPage tasks={sampleTasks} categories={sampleCategories} />;
}

export default App;
