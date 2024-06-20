'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { likeOrUnlikePost } from "@/lib/actions/thread.actions";

interface Props {
    threadId: string;
    currentUserId: string;
    isLiked: boolean;
    likeCount: number;
    isLoggedIn?: boolean
}

const LikeThread = ({
    threadId,
    currentUserId,
    isLiked,
    likeCount,
    isLoggedIn,
}: Props) => {
    const pathname = usePathname();
    const router = useRouter();
    
    // Initialize state based on likes prop
    const [isLikedH, setIsLikedH] = useState(isLiked);
    const [likeCountH, setLikeCountH] = useState(likeCount);

    
    const handleLikeClick = async () => {
        if(isLoggedIn) {
            try {
                await likeOrUnlikePost(JSON.parse(threadId), currentUserId, pathname);
                setIsLikedH(prevLiked => !prevLiked);
                setLikeCountH(prevCount => (isLikedH ? prevCount - 1 : prevCount + 1));
            } catch (error: any) {
                console.error(`Error liking/unliking the post: ${error.message}`);
            }
        }
    };

    return (
        <>
            <Image 
                src={isLikedH ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'} 
                alt='like' 
                width={24} 
                height={24} 
                className="cursor-pointer object-contain"
                onClick={handleLikeClick}
            >
            </Image>
                {likeCountH > 0 && 
                    <span className='text-red-500 text-small-regular'>{likeCountH}</span>
                }
        </>
    );
};

export default LikeThread;
