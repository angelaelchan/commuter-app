import { useApp } from '../app/state';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Empty, inactive, Screen } from '../components/Screen';
import { Tabs } from '../components/Tabs';
import { api } from '../data/api';
import { ago, clock } from '../lib/time';

export function ClassPage({ courseId, tab }: { courseId: string; tab: 'forum' | 'chat' }) {
  const { navigate } = useApp();
  const course = api.course(courseId);
  if (!course) return null;
  const unread = api.unreadChats(courseId);

  return (
    <Screen
      nav="classes"
      header={
        <div className="stack stack--12">
          {/* Back returns to the class list in the view it was left in. */}
          <button type="button" className="back title-regular" onClick={() => navigate({ name: 'classes' })}>
            {'< Back'}
          </button>
          <h1 className="display-regular">
            {course.code}: {course.name}
          </h1>
        </div>
      }
    >
      <div className="stack stack--16">
        <Tabs
          label="Class sections"
          items={[
            { id: 'forum', label: 'Forum' },
            { id: 'chat', label: 'Private Chat', extra: unread > 0 ? <Badge count={unread} /> : undefined },
          ]}
          active={tab}
          onChange={(t) => navigate({ name: 'class', courseId, tab: t })}
        />
        {/* Discussion thread and new chat have no wireframes yet. */}
        <Button block onClick={inactive}>
          {tab === 'forum' ? 'Start a discussion' : 'Start a new chat'}
        </Button>
      </div>

      <div className="list list--section">{tab === 'forum' ? <Forum courseId={courseId} /> : <Chats courseId={courseId} />}</div>
    </Screen>
  );
}

function Forum({ courseId }: { courseId: string }) {
  const posts = api.forumPosts(courseId);
  if (!posts.length) return <Empty>No discussions yet.</Empty>;
  return posts.map((p) => {
    const author = api.person(p.authorId)?.name ?? '';
    return (
      <article key={p.id} className="card post" onClick={inactive}>
        <div className="post__meta">
          <span className="post__author">
            <Avatar name={author} size="s" />
            <span className="specials-label">
              {author} · {ago(p.minutesAgo)}
            </span>
          </span>
          <span className="tag specials-label">{p.tag}</span>
        </div>
        <div className="post__text">
          <h3 className="title-s">{p.title}</h3>
          <p className="body-xs post__preview">{p.preview}</p>
        </div>
        <p className="specials-label">
          {p.replies} {p.replies === 1 ? 'reply' : 'replies'} · {p.answered ? 'Answered' : 'Unanswered'}
        </p>
      </article>
    );
  });
}

function Chats({ courseId }: { courseId: string }) {
  const chats = api.chats(courseId);
  if (!chats.length) return <Empty>No chats yet.</Empty>;
  return chats.map((c) => {
    const name = api.person(c.personId)?.name ?? '';
    return (
      <article key={c.id} className="card chat-row" onClick={inactive}>
        <span className={`dot ${c.unread ? '' : 'dot--read'}`} aria-label={c.unread ? 'Unread' : undefined} />
        <Avatar name={name} size="xl" />
        <span className="chat-row__text">
          <span className="specials-label">
            {name} · {c.time < 0 ? 'Yesterday' : clock(c.time)}
          </span>
          <span className="body-xs chat-row__message">{c.lastMessage}</span>
        </span>
      </article>
    );
  });
}
