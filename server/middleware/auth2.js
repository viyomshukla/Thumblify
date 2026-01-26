// middleware/auth2.js

const protectRoute = (req, res, next) => {
  // Check if the session exists and has a userId
  if (req.session && req.session.userId) {
    return next(); // User is authenticated, proceed to the route
  }

  // If no session, return Unauthorized
  return res.status(401).json({ 
    success: false, 
    message: "Unauthorized: Please log in to access this feature." 
  });
};

export default protectRoute;