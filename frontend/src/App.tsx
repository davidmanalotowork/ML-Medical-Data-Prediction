import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UploadPage } from './pages/Upload';
import { ManualEntryPage } from './pages/ManualEntry';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ManualEntryPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
