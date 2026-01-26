import Navbar from './components/Navbar';
import Home from './pages/Home';
import Generate from './pages/generate';
import Community from './pages/community';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import UserProfile from './pages/userInformation';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ThumbnailEditor from './pages/editor';
// In your App.tsx or main component
import { useEffect } from 'react';
import authAPI from './utils/api';
function App() {

	useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('auth') === 'success') {
    // Refresh user data
    authAPI.verify().then(() => {
      window.history.replaceState({}, '', '/');
    });
  }
}, []);
	return (
		<AuthProvider>
			<BrowserRouter>
				<SoftBackdrop />
				<LenisScroll />
				<Navbar />
				<Routes>
					<Route path="/" element={<><Home /><Footer /></>} />
					<Route path="/generate/:id?" element={<><Generate /><Footer /></>} />
					<Route path="/community" element={<><Community /><Footer /></>} />
					<Route path="/about" element={<><UserProfile /><Footer /></>} />
					<Route path="/editor" element={<><ThumbnailEditor /><Footer /></>} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
export default App;