const protectRoute = async(req, res, next) => {
    const {isLoggedIn, userId} = req.session;
    if (!isLoggedIn || !userId) {
        return res.status(401).json({message: "Unauthorized"});
    }
    next();
}

export default protectRoute;
