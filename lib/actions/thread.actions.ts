'use server'

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose"

import Thread from "../models/thread.model";
import User from "../models/user.model";

interface Params {
    text: string;
    author: string;
    communityId: string | null;
    path: string;
}

export async function createThread({ text, author, communityId, path }: Params) {
    try {
        await connectToDB()
        const createThread = await Thread.create({
            text,
            author,
            community: null,
        });

        await User.findByIdAndUpdate(author, {
            $push: { threads: createThread._id }
        });

        revalidatePath(path)
    } catch (error: any) {
        console.error(`Error in creating thread: ${error.message}`);
        throw new Error(`Error in creating thread: ${error.message}`);
    }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    try {
        await connectToDB();
      
        const skipAmount = (pageNumber - 1) * pageSize;
      
        const postsQuery = Thread.find({ parentID: { $in: [null, undefined] } })
          .sort({ createdAt: 'desc' })
          .skip(skipAmount)
          .limit(pageSize)
          .populate({ 
            path: 'author', 
            model: User, 
          })
          .populate({
            path: 'children',
            populate: {
              path: 'author',
              model: User,
              select: '_id name parentId image username',
            },
          })
          .populate({
            path: 'likes',
            model: User,
            select: 'id',
          });
      
        const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });
      
        const posts = await postsQuery.exec();
      
        const isNext = totalPostsCount > skipAmount + posts.length;
          // console.log(posts[0].likes);
        return { posts, isNext };
    } catch (error: any) {
        console.log(`Error in fetching posts: ${error.message}`);
        throw new Error(`Error in fetching posts: ${error.message}`);
    }
}

export async function likeOrUnlikePost(threadId: string, userId: string, path: string) {
  try {
    await connectToDB();

    const likedThread = await Thread.findById(threadId);
    if (!likedThread) throw new Error(`Thread not found`);

    const user = await User.findOne({ id: userId });
    if (!user) throw new Error(`User not found`);

    const userIndex = likedThread.likes.indexOf(user._id);
    const threadIndex = user.likedThreads.indexOf(threadId);

    if (userIndex !== -1) {
      // Unlike the post
      likedThread.likes.splice(userIndex, 1);
      user.likedThreads.splice(threadIndex, 1);
    } else {
      // Like the post
      likedThread.likes.push(user._id);
      user.likedThreads.push(threadId);
    }

    await likedThread.save();
    await user.save();

    revalidatePath(path);
  } catch (error: any) {
    console.log(`Error in liking or unliking the thread: ${error.message}`);
    throw new Error(`Error in liking or unliking the thread: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  try {
    connectToDB();
    const thread = await Thread.findById(threadId)
      .populate({
        path: 'author',
        model: User,
        select: '_id id name image username',
      })
      .populate({
        path: 'likes',
        model: User,
        select: 'id',
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: "_id id name parentId image username",
          },
          {
            path: 'likes',
            model: User,
            select: 'id',
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: 'author',
              model: User,
              select: "_id id name parentId image username",
            },
          },
        ],
      }).exec();

      return thread;

  } catch (error: any) {
    console.log(`Failed to get thread: ${error.message}`);
    throw new Error(`Failed to get thread: ${error.message}`);
  }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
  ) {  
    try {
      await connectToDB();
      const originalThread = await Thread.findById(threadId);
      if (!originalThread) throw new Error("Thread not found");
  
      const commentThread = new Thread({
        text: commentText,
        author: userId,
        parentId: threadId,
      });
  
      const savedCommentThread = await commentThread.save();
  
      originalThread.children.push(savedCommentThread._id);
  
      await originalThread.save();
  
      revalidatePath(path);
    } catch (error: any) {
      console.error(`Error in adding comment: ${error.message}`);
      throw new Error(`Error in adding comment: ${error.message}`);
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const descendentThreads = [];
  const stack = [threadId];

  while (stack.length > 0) {
    const currentThreadId = stack.pop();
    const childThreads = await Thread.find({ parentId: currentThreadId });

    for (const childThread of childThreads) {
      descendentThreads.push(childThread);
      stack.push(childThread._id);  // Add the child thread's ID to the stack for further processing
    }
  }

  return descendentThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    await connectToDB();

    const mainThread = await Thread.findById(id).populate("author");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    const descendentThreads = await fetchAllChildThreads(id);

    const descendentThreadIds = [
      id,
      ...descendentThreads.map((thread) => thread._id),
    ];

    const uniqueAuthorIds = new Set(
      [
        ...descendentThreads.map((thread) => thread.author?._id?.toString()),
        mainThread.author?._id?.toString(),
      ].filter((id) => id != undefined)
    );

    // Collect unique user IDs who have liked the threads
    const likedUserIds = new Set(
      [
        ...descendentThreads.flatMap((thread) => thread.likes.map((like: any) => like.toString())),
        ...mainThread.likes.map((like: any) => like.toString())
      ]
    );

    await Thread.deleteMany({ _id: { $in: descendentThreadIds } });
    
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds)}},
      { $pull: { threads: { $in: descendentThreadIds } } },
    );

    // Remove the deleted threads from the likedThreads array of each user
    await User.updateMany(
      { _id: { $in: Array.from(likedUserIds) } },
      { $pull: { likedThreads: { $in: descendentThreadIds } } },
    );

    revalidatePath(path);

  } catch (error: any) {
    console.log(`Failed to delete thread: ${error.message}`);
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

