import CustomError from "../middleware/errorHandler.js";
import FeelingsPost from "../models/feelingsPost.model.js";
import FeelingPostComment from "../models/feelingsPostComment.js";
import Subscription from "../models/providerSubscription.model.js";
import User from "../models/user.model.js";


// patient create how're you feeling post
export const createFeelingEntry = async (req, res, next) => {
    try {
        const { content, media, visible_to, visibility_type } = req.body;
        const userId = req.user._id;

        if (!content) {
            throw new CustomError(400, "Content is required for feeling entry");
        }

        //Get patient subscription to determine which providers they can share with
        const subscriptions = await Subscription.find({
            patient: userId,
            status: "active",
        }).select("provider");

        const subscribedProviderIds = subscriptions.map(sub => sub.provider.toString());

        let finalVisibleTo = [];

        //HANDLE VISIBILITY

        // 1. PRIVATE (no provider sees it)
        if (visibility_type === "private") {
            finalVisibleTo = [];
        }

        // 2. ALL SUBSCRIBED PROVIDERS
        else if (visibility_type === "all_providers") {
            finalVisibleTo = subscribedProviderIds;
        }

        // 3. SELECTED PROVIDERS
        else if (visibility_type === "selected_providers") {
            if (!visible_to || visible_to.length === 0) {
                throw new CustomError(400, "Please select at least one provider");
            }

            // 🔥 SECURITY: ensure selected providers are actually subscribed
            const invalidProviders = visible_to.filter(
                (id) => !subscribedProviderIds.includes(id)
            );

            if (invalidProviders.length > 0) {
                throw new CustomError(
                    403,
                    "You can only select providers you are subscribed to"
                );
            }

            finalVisibleTo = visible_to;
        }

        //CREATE POST
        const feelingsPost = await FeelingsPost.create({
            user: userId,
            content,
            media,
            visible_to: finalVisibleTo,
            visibility_type,
        });

        res.status(201).json({
            success: true,
            message: "Feeling post entry created successfully",
            data: feelingsPost,
        });
    } catch (error) {
        next(error);
    }
};

// patient get how're you feeling posts
export const getFeelingEntries = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const feelingsPosts = await FeelingsPost.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Feeling Post retrieved successfully",
            data: feelingsPosts,
        });
    } catch (error) {
        next(error);
    }
};

//UPDATE FEELING POST (for future use)
export const updateFeelingEntry = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const { content, media, visible_to, visibility_type } = req.body;
        const feelingsPost = await FeelingsPost.findOne({ _id: postId, user: userId });

        if (!feelingsPost) {
            throw new CustomError(404, "Feeling post not found", "NotFoundError");
        }
        feelingsPost.content = content || feelingsPost.content;
        feelingsPost.media = media || feelingsPost.media;
        feelingsPost.visible_to = visible_to || feelingsPost.visible_to;
        feelingsPost.visibility_type = visibility_type || feelingsPost.visibility_type;
        await feelingsPost.save();

        res.status(200).json({
            success: true,
            message: "Feeling post updated successfully",
            data: feelingsPost,
        });
    } catch (error) {
        next(error);
    }
};

// provider comment on patient's feelings post (for future use)
export const commentOnFeelingsPost = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { postId } = req.params;
        const { content } = req.body;
        
        const find_post = await FeelingsPost.findById(postId);
        if (!find_post) {
            throw new CustomError(404, "Post not found", "NotFoundError");
        }

        if (!content || content.trim() === "") {
            throw new CustomError(400, "Comment content is required", "ValidationError");
        }
        
        const comment = await FeelingPostComment.create({
            post: postId,
            user: userId,
            content,
        });
        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });
    } catch (error) {
        next(error)
    }    
};  

// get comments for a feelings post (for future use)
export const getCommentsForFeelingsPost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        
        const find_post = await FeelingsPost.findById(postId);

        if (!find_post) {
            throw new CustomError(404, "Post not found", "NotFoundError");
        }

        const comments = await FeelingPostComment.find({ post: postId })
        .populate("user", "full_name email")
        .sort({ createdAt: -1 });  

        res.status(200).json({
            success: true,
            message: "Comments retrieved successfully",
            data: comments,
        });
    } catch (error) {
        next(error);
    }
};