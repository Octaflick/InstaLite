import { useEffect, useState } from "react";
import { api } from "./api.js";

function UserCard({ user }) {
  return (
    <article className="card">
      <div className="avatar">{user.fullname?.[0] ?? "?"}</div>
      <div>
        <strong>{user.fullname}</strong>
        <p>@{user.username}</p>
      </div>
      {user._count && (
        <span className="count">{user._count.posts} posts · {user._count.likes} likes</span>
      )}
    </article>
  );
}

function PostCard({ post, onLike }) {
  return (
    <article className="post-card">
      <img src={post.imageUrl} alt={post.caption ?? "Post"} />
      <div className="post-body">
        <div className="post-author">
          <span className="avatar small">{post.author?.fullname?.[0] ?? "?"}</span>
          <div>
            <strong>{post.author?.fullname}</strong>
            <p>@{post.author?.username}</p>
          </div>
        </div>
        {post.caption && <p className="caption">{post.caption}</p>}
        {post.location && <p className="location">📍 {post.location}</p>}
        <button type="button" onClick={() => onLike(post.id)}>
          ♥ {post._count?.likes ?? 0}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [tab, setTab] = useState("posts");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState("");

  async function loadUsers() {
    try {
      const data = await api(`/users?search=${encodeURIComponent(search)}&limit=50`);
      setUsers(data.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadPosts() {
    try {
      const query = new URLSearchParams({ limit: "24", sortBy: "likes", order: "desc" });
      if (location) query.set("location", location);
      if (search) query.set("search", search);
      const data = await api(`/posts?${query}`);
      setPosts(data.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    api("/health").then((data) => setHealth(data.status)).catch(() => setHealth("offline"));
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    else loadPosts();
  }, [tab]);

  async function likePost(postId) {
    setError("");
    try {
      const user = users[0];
      if (!user) {
        const userPage = await api("/users?limit=1");
        await api(`/posts/${postId}/likes`, {
          method: "POST",
          body: JSON.stringify({ userId: userPage.data[0].id }),
        });
      } else {
        await api(`/posts/${postId}/likes`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });
      }
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">INSTA<span>LITE</span></p>
          <h1>{tab === "posts" ? "Discover" : "Community"}</h1>
        </div>
        <span className={`health ${health}`}>● API {health}</span>
      </header>

      <nav>
        <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>Posts</button>
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>People</button>
      </nav>

      <section className="toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={tab === "posts" ? "Search captions" : "Search people"}
        />
        {tab === "posts" && (
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
          />
        )}
        <button type="button" onClick={() => (tab === "posts" ? loadPosts() : loadUsers())}>Search</button>
      </section>

      {error && <p className="error">{error}</p>}

      {tab === "posts" ? (
        <section className="post-grid">
          {posts.map((post) => <PostCard key={post.id} post={post} onLike={likePost} />)}
        </section>
      ) : (
        <section className="user-grid">
          {users.map((user) => <UserCard key={user.id} user={user} />)}
        </section>
      )}
    </main>
  );
}
