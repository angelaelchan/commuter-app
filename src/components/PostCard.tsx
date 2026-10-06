import { api } from '../data/api';
import type { ForumPost } from '../data/types';
import { ago } from '../lib/time';
import { Avatar } from './Avatar';
import { inactive } from './Screen';

interface Props {
  post: ForumPost;
  /** Show the course code above the title (used outside a class page). */
  showCourse?: boolean;
  /** Where tapping the card goes. Threads have no wireframe yet, so it defaults to doing nothing. */
  onOpen?: () => void;
}

export function PostCard({ post, showCourse, onOpen }: Props) {
  const author = api.person(post.authorId)?.name ?? '';
  const course = showCourse ? api.course(post.courseId) : undefined;
  const body = (
    <>
      <div className="post__meta">
        <span className="post__author">
          <Avatar name={author} size="s" />
          <span className="specials-label">
            {author} · {ago(post.minutesAgo)}
          </span>
        </span>
        <span className="tag specials-label">{post.tag}</span>
      </div>
      <div className="post__text">
        {course && <span className="specials-label post__course">{course.code}</span>}
        <h3 className="title-s">{post.title}</h3>
        <p className="body-xs post__preview">{post.preview}</p>
      </div>
      <p className="specials-label">
        {post.replies} {post.replies === 1 ? 'reply' : 'replies'} · {post.answered ? 'Answered' : 'Unanswered'}
      </p>
    </>
  );
  return onOpen ? (
    <button type="button" className="card post" onClick={onOpen} aria-label={`${course ? `${course.code}: ` : ''}${post.title}`}>
      {body}
    </button>
  ) : (
    <article className="card post" onClick={inactive}>
      {body}
    </article>
  );
}
