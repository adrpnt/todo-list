import { Navigate, Route, Routes } from "react-router";

import { PrivateLayout } from "./components/PrivateLayout";
import { PublicLayout } from "./components/PublicLayout";
import { ListsPage } from "./pages/ListsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TasksPage } from "./pages/TasksPage";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateLayout />}>
        <Route path="/" element={<ListsPage />} />
        <Route path="/lists/:listId" element={<TasksPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
