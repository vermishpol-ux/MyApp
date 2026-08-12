import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context";
import { Layout } from "./components";
import { CollectionPage, SettingsPage, Help } from "./pages";
import {
  EnhancedStudentProfile,
  GroupProfile,
  CalendarPage,
} from "./advanced";
import {
  LessonsOverview,
  PaymentsPage,
} from "./finance";
import {
  RestoredDashboard,
  RestoredStudents,
  RestoredStatistics,
} from "./regressions";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<RestoredDashboard />} />
            <Route path="students" element={<RestoredStudents />} />
            <Route path="students/:id" element={<EnhancedStudentProfile />} />
            <Route path="groups/:id" element={<GroupProfile />} />
            <Route path="schedule" element={<CalendarPage />} />
            <Route path="lessons" element={<LessonsOverview />} />
            <Route
              path="homework"
              element={<CollectionPage type="homework" />}
            />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="statistics" element={<RestoredStatistics />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  </React.StrictMode>,
);
