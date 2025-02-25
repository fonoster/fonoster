import NotFound from './components/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App; 