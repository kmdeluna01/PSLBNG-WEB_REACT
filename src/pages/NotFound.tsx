// Import necessary hooks and functions
import { useLocation } from "react-router-dom"; // For accessing the current URL location
import { useEffect } from "react"; // For running side effects after rendering

// NotFound component: displayed when user tries to visit a non-existent route
const NotFound = () => {
  // Use useLocation hook to get the current URL location (pathname)
  const location = useLocation();

  // useEffect runs whenever the location pathname changes (i.e., when a new route is accessed)
  useEffect(() => {
    // Log an error message in the console for debugging purposes
    console.error(
      "404 Error: User attempted to access non-existent route:", 
      location.pathname // Log the current pathname of the non-existent route
    );
  }, [location.pathname]); // Dependency array: run the effect when pathname changes

  return (
    // Outer div that takes up the full screen and centers its content
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Centered content */}
      <div className="text-center">
        {/* 404 error title */}
        <h1 className="text-4xl font-bold mb-4">404</h1>
        {/* Message indicating the page was not found */}
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        {/* Link to navigate back to the home page */}
        <a href="/merchant" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

// Export the NotFound component to be used in other parts of the app
export default NotFound;
