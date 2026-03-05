import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ── Constants ──────────────────────────────────────────────────────────────────
const BOOK_GENRES = [
  "Classic Literature","Fiction","Non-Fiction","Mystery","Thriller",
  "Science Fiction","Fantasy","Romance","Historical Fiction","Biography",
  "Memoir","Self-Help","Philosophy","Science","Psychology","Poetry",
  "Horror","Graphic Novel","Young Adult","Children's","Travel","Humor","Other",
];

const MOVIE_GENRES = [
  "Action","Adventure","Animation","Biography","Comedy","Crime",
  "Documentary","Drama","Fantasy","Historical","Horror","Musical",
  "Mystery","Romance","Science Fiction","Thriller","War","Western","Other",
];

const RATINGS = [1, 2, 3, 4, 5];

const SAMPLE_BOOKS = [
  { id: 1, title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", genre: "Mystery", note: "A gorgeous labyrinth of a book set in post-war Barcelona.", rating: 5, status: "read", dateAdded: "2024-01-15" },
  { id: 2, title: "Middlemarch", author: "George Eliot", genre: "Classic Literature", note: "One of the greatest novels in the English language.", rating: 5, status: "read", dateAdded: "2024-02-20" },
  { id: 3, title: "Piranesi", author: "Susanna Clarke", genre: "Fantasy", note: "Strange, beautiful, unlike anything else.", rating: 4, status: "read", dateAdded: "2024-03-10" },
  { id: 4, title: "The Name of the Rose", author: "Umberto Eco", genre: "Mystery", note: "", rating: 0, status: "wishlist", dateAdded: "2024-04-05" },
  { id: 5, title: "Invisible Cities", author: "Italo Calvino", genre: "Classic Literature", note: "", rating: 0, status: "wishlist", dateAdded: "2024-04-12" },
];

const SAMPLE_MOVIES = [
  { id: 101, title: "Parasite", director: "Bong Joon-ho", genre: "Thriller", note: "A masterpiece of tension and social commentary.", rating: 5, status: "watched", dateAdded: "2024-01-20" },
  { id: 102, title: "Amélie", director: "Jean-Pierre Jeunet", genre: "Romance", note: "Whimsical, warm, and utterly magical.", rating: 5, status: "watched", dateAdded: "2024-02-14" },
  { id: 103, title: "Blade Runner 2049", director: "Denis Villeneuve", genre: "Science Fiction", note: "Visually stunning slow-burn sequel.", rating: 4, status: "watched", dateAdded: "2024-03-05" },
  { id: 104, title: "The Grand Budapest Hotel", director: "Wes Anderson", genre: "Comedy", note: "", rating: 0, status: "watchlist", dateAdded: "2024-04-01" },
  { id: 105, title: "Portrait of a Lady on Fire", director: "Céline Sciamma", genre: "Drama", note: "", rating: 0, status: "watchlist", dateAdded: "2024-04-18" },
];

const GENRE_COLORS = {
  "Classic Literature":"#8B1A1A","Fiction":"#7A5C2E","Non-Fiction":"#2E5C7A",
  "Mystery":"#4A2E7A","Thriller":"#7A2E4A","Science Fiction":"#1A5C5C",
  "Fantasy":"#4A5C1A","Romance":"#8B3A5C","Historical Fiction":"#5C3A1A",
  "Biography":"#1A3A5C","Memoir":"#3A5C1A","Self-Help":"#5C5C1A",
  "Philosophy":"#3A1A5C","Science":"#1A5C3A","Psychology":"#5C1A3A",
  "Poetry":"#8B6B1A","Horror":"#2E2E2E","Graphic Novel":"#5C2E1A",
  "Young Adult":"#1A5C7A","Children's":"#7A5C1A","Travel":"#1A7A5C",
  "Humor":"#7A7A1A",
  "Action":"#8B3A1A","Adventure":"#4A6B2E","Animation":"#6B4A8B",
  "Comedy":"#7A6B1A","Crime":"#4A2A4A","Documentary":"#2A5C6B",
  "Drama":"#5C3A5C","Historical":"#6B4A2A","Musical":"#8B4A6B",
  "War":"#4A4A3A","Western":"#7A5A2A",
  "Other":"#5C5C5C",
};

let nextId = 200;
function generateId() { return nextId++; }
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

// ── StarRating ─────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readOnly=false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {RATINGS.map(s => (
        <span key={s}
          onClick={() => !readOnly && onChange && onChange(s===value ? 0 : s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{ fontSize:readOnly?14:18, cursor:readOnly?"default":"pointer", color:s<=(hover||value)?"#C9A84C":"#D4C5A0", transition:"color 0.15s", lineHeight:1 }}
        >★</span>
      ))}
    </div>
  );
}

// ── GenrePill ──────────────────────────────────────────────────────────────────
function GenrePill({ genre }) {
  const color = GENRE_COLORS[genre] || "#5C5C5C";
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontFamily:"'Lora',serif", letterSpacing:"0.04em", fontWeight:600, backgroundColor:color+"22", color, border:`1px solid ${color}44` }}>{genre}</span>
  );
}

// ── ItemCard ───────────────────────────────────────────────────────────────────
function ItemCard({ item, isMovie, onEdit, onDelete, onToggleStatus }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = item.status === (isMovie ? "watched" : "read");
  const spineColor = GENRE_COLORS[item.genre] || "#8B1A1A";
  return (
    <div style={{ background:isDone?"linear-gradient(135deg,#FEFDF8,#F8F3E8)":"linear-gradient(135deg,#F0F4F8,#E8EEF5)", borderRadius:6, display:"flex", overflow:"hidden", boxShadow:"0 2px 12px rgba(44,24,16,0.08)", transition:"box-shadow 0.25s, transform 0.25s", border:"1px solid rgba(201,168,76,0.15)" }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 28px rgba(44,24,16,0.14)";e.currentTarget.style.transform="translateY(-2px)"}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 12px rgba(44,24,16,0.08)";e.currentTarget.style.transform="translateY(0)"}}>
      <div style={{ width:6, background:`linear-gradient(180deg,${spineColor},${spineColor}CC)`, flexShrink:0 }} />
      <div style={{ flex:1, padding:"14px 16px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:"#2C1810", margin:"0 0 2px", lineHeight:1.3 }}>{item.title}</h3>
            <p style={{ fontFamily:"'Lora',serif", fontSize:12, color:"#8B6B50", margin:0, fontStyle:"italic" }}>
              {isMovie ? "dir. "+item.director : "by "+item.author}
            </p>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
            <button onClick={()=>onToggleStatus(item.id)} style={{ width:28,height:28,borderRadius:"50%",border:`2px solid ${isDone?"#C9A84C":"#8BA8C9"}`,background:isDone?"#C9A84C22":"#8BA8C922",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:isDone?"#8B6B1A":"#4A6B8A" }}>{isDone?"✓":"○"}</button>
            <button onClick={()=>onEdit(item)} style={{ width:28,height:28,borderRadius:"50%",border:"2px solid #C9A84C44",background:"transparent",cursor:"pointer",fontSize:12,color:"#8B6B1A",display:"flex",alignItems:"center",justifyContent:"center" }}>✎</button>
            <button onClick={()=>onDelete(item.id)} style={{ width:28,height:28,borderRadius:"50%",border:"2px solid #C98A8A44",background:"transparent",cursor:"pointer",fontSize:13,color:"#8B4A4A",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"8px 0 6px", flexWrap:"wrap" }}>
          <GenrePill genre={item.genre} />
          {item.rating>0 && <StarRating value={item.rating} readOnly />}
          <span style={{ fontSize:10,color:"#B0967C",fontFamily:"'Lora',serif",marginLeft:"auto" }}>{formatDate(item.dateAdded)}</span>
        </div>
        {item.note && (
          <div>
            <p style={{ fontFamily:"'Lora',serif",fontSize:12,color:"#6B5040",margin:0,lineHeight:1.5,fontStyle:"italic",display:expanded?"block":"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",borderLeft:"2px solid #C9A84C66",paddingLeft:8 }}>"{item.note}"</p>
            {item.note.length>100 && <button onClick={()=>setExpanded(!expanded)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#8B6B1A",fontFamily:"'Lora',serif",padding:"2px 0",marginTop:2 }}>{expanded?"show less":"read more..."}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ title, icon, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(20,10,5,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)",animation:"fadeIn 0.2s ease" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"linear-gradient(160deg,#FEFDF8,#F5EDD8)",borderRadius:12,width:"100%",maxWidth:500,boxShadow:"0 20px 60px rgba(20,10,5,0.3)",overflow:"hidden",animation:"slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background:"linear-gradient(135deg,#8B1A1A,#6B1414)",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#F5EDD8",margin:0,fontSize:18,fontWeight:700 }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#F5EDD8",cursor:"pointer",fontSize:18,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
        </div>
        <div style={{ padding:"20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── ItemForm ───────────────────────────────────────────────────────────────────
function ItemForm({ initial, isMovie, onSave, onClose }) {
  const genres = isMovie ? MOVIE_GENRES : BOOK_GENRES;
  const doneStatus = isMovie ? "watched" : "read";
  const pendingStatus = isMovie ? "watchlist" : "wishlist";
  const [form, setForm] = useState(initial || { title:"", ...(isMovie?{director:""}:{author:""}), genre:genres[0], note:"", rating:0, status:doneStatus });
  const [errors, setErrors] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const validate = () => {
    const e={};
    if (!form.title.trim()) e.title=`${isMovie?"Movie":"Book"} title is required`;
    if (!(isMovie?form.director:form.author)?.trim()) e.person=`${isMovie?"Director":"Author"} is required`;
    setErrors(e); return !Object.keys(e).length;
  };

  const handleAIFill = async () => {
    if (!form.title.trim()) { setErrors({title:"Enter a title first"}); return; }
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:200,
          messages:[{ role:"user", content:`For the ${isMovie?"movie":"book"} titled "${form.title}", provide the ${isMovie?"director's":"author's"} full name and best-matching genre from: ${genres.join(", ")}. Respond ONLY with valid JSON: {"${isMovie?"director":"author"}":"...","genre":"..."} and nothing else.` }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      if (isMovie && parsed.director) set("director", parsed.director);
      if (!isMovie && parsed.author) set("author", parsed.author);
      if (parsed.genre && genres.includes(parsed.genre)) set("genre", parsed.genre);
    } catch {/*silent*/} finally { setAiLoading(false); }
  };

  const handleSubmit = () => { if (!validate()) return; onSave({...form, title:form.title.trim()}); };

  const inp = { width:"100%", boxSizing:"border-box", padding:"9px 12px", border:"1.5px solid #D4C5A0", borderRadius:6, fontFamily:"'Lora',serif", fontSize:13, background:"#FEFCF5", color:"#2C1810", outline:"none" };
  const lbl = { display:"block", fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:600, color:"#6B4A2A", marginBottom:5, letterSpacing:"0.04em", textTransform:"uppercase" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div>
        <label style={lbl}>{isMovie?"Movie Title":"Book Title"} *</label>
        <div style={{ display:"flex", gap:8 }}>
          <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder={isMovie?"e.g. Inception":"e.g. The Great Gatsby"}
            style={{...inp, flex:1, borderColor:errors.title?"#C94A4A":"#D4C5A0"}}
            onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor=errors.title?"#C94A4A":"#D4C5A0"} />
          <button onClick={handleAIFill} disabled={aiLoading}
            style={{ padding:"9px 14px", background:aiLoading?"#D4C5A0":"linear-gradient(135deg,#C9A84C,#A8873C)", border:"none", borderRadius:6, cursor:aiLoading?"not-allowed":"pointer", color:"#fff", fontFamily:"'Lora',serif", fontSize:11, fontWeight:600, whiteSpace:"nowrap", flexShrink:0, display:"flex", alignItems:"center", gap:5 }}>
            {aiLoading?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>:"✦"} AI Fill
          </button>
        </div>
        {errors.title && <p style={{color:"#C94A4A",fontSize:11,margin:"3px 0 0",fontFamily:"'Lora',serif"}}>{errors.title}</p>}
        <p style={{color:"#8B6B50",fontSize:10,margin:"3px 0 0",fontFamily:"'Lora',serif",fontStyle:"italic"}}>✦ Enter title and click "AI Fill" to auto-detect {isMovie?"director":"author"} & genre</p>
      </div>

      <div>
        <label style={lbl}>{isMovie?"Director":"Author"} *</label>
        <input value={isMovie?(form.director||""):(form.author||"")} onChange={e=>set(isMovie?"director":"author",e.target.value)}
          placeholder={isMovie?"e.g. Christopher Nolan":"e.g. F. Scott Fitzgerald"}
          style={{...inp, borderColor:errors.person?"#C94A4A":"#D4C5A0"}}
          onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor=errors.person?"#C94A4A":"#D4C5A0"} />
        {errors.person && <p style={{color:"#C94A4A",fontSize:11,margin:"3px 0 0",fontFamily:"'Lora',serif"}}>{errors.person}</p>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={lbl}>Genre</label>
          <select value={form.genre} onChange={e=>set("genre",e.target.value)} style={inp}
            onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor="#D4C5A0"}>
            {genres.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Status</label>
          <div style={{ display:"flex", gap:6, marginTop:2 }}>
            {[doneStatus, pendingStatus].map(s=>(
              <button key={s} onClick={()=>set("status",s)}
                style={{ flex:1, padding:"9px 4px", border:`1.5px solid ${form.status===s?"#C9A84C":"#D4C5A0"}`, borderRadius:6, background:form.status===s?"#C9A84C22":"#FEFCF5", color:form.status===s?"#7A5C1A":"#8B6B50", cursor:"pointer", fontFamily:"'Lora',serif", fontSize:10.5, fontWeight:form.status===s?600:400 }}>
                {s===doneStatus?(isMovie?"✓ Watched":"✓ Read"):(isMovie?"🍿 Watchlist":"♡ Wishlist")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {form.status===doneStatus && (
        <div>
          <label style={lbl}>Rating</label>
          <StarRating value={form.rating} onChange={v=>set("rating",v)} />
        </div>
      )}

      <div>
        <label style={lbl}>Notes</label>
        <textarea value={form.note} onChange={e=>set("note",e.target.value)}
          placeholder={isMovie?"Your thoughts, favorite scenes, a short review...":"Your thoughts, quotes, or a short review..."}
          rows={3} style={{...inp, resize:"vertical", lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor="#C9A84C"} onBlur={e=>e.target.style.borderColor="#D4C5A0"} />
      </div>

      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px", background:"transparent", border:"1.5px solid #D4C5A0", borderRadius:6, cursor:"pointer", fontFamily:"'Playfair Display',serif", color:"#8B6B50", fontSize:14 }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex:2, padding:"10px", background:"linear-gradient(135deg,#8B1A1A,#6B1414)", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"'Playfair Display',serif", color:"#F5EDD8", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(139,26,26,0.3)" }}>
          {initial?"Save Changes":`Add to ${isMovie?"Collection":"Library"}`}
        </button>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function BookWorm() {
  const [section, setSection] = useState("books");
  const [books, setBooks] = useState(() => {
    try { const s = localStorage.getItem("bookworm_books"); return s ? JSON.parse(s) : SAMPLE_BOOKS; }
    catch { return SAMPLE_BOOKS; }
  });
  const [movies, setMovies] = useState(() => {
    try { const s = localStorage.getItem("bookworm_movies"); return s ? JSON.parse(s) : SAMPLE_MOVIES; }
    catch { return SAMPLE_MOVIES; }
  });
  const [activeTab, setActiveTab] = useState("done");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("All");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const isMovie = section === "movies";
  const items = isMovie ? movies : books;
  const setItems = isMovie ? setMovies : setBooks;
  const doneStatus = isMovie ? "watched" : "read";
  const pendingStatus = isMovie ? "watchlist" : "wishlist";

  const showToast = useCallback((msg, type="success") => {
    setToast({msg, type}); setTimeout(()=>setToast(null), 3000);
  }, []);

  useEffect(() => { localStorage.setItem("bookworm_books", JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem("bookworm_movies", JSON.stringify(movies)); }, [movies]);

  const switchSection = (s) => {
    setSection(s); setActiveTab("done"); setSearch(""); setFilterGenre("All");
    setSortBy("dateAdded"); setShowModal(false); setEditItem(null);
  };

  const tabStatus = activeTab==="done" ? doneStatus : pendingStatus;

  const filtered = items
    .filter(i=>i.status===tabStatus)
    .filter(i=>{ const q=search.toLowerCase(); const p=isMovie?i.director:i.author; return !q||i.title.toLowerCase().includes(q)||(p||"").toLowerCase().includes(q); })
    .filter(i=>filterGenre==="All"||i.genre===filterGenre)
    .sort((a,b)=>{
      if(sortBy==="title") return a.title.localeCompare(b.title);
      if(sortBy==="person") return (isMovie?a.director:a.author).localeCompare(isMovie?b.director:b.author);
      if(sortBy==="rating") return b.rating-a.rating;
      return new Date(b.dateAdded)-new Date(a.dateAdded);
    });

  const doneCount = items.filter(i=>i.status===doneStatus).length;
  const pendingCount = items.filter(i=>i.status===pendingStatus).length;
  const avgRating = (()=>{ const r=items.filter(i=>i.rating>0); return r.length?(r.reduce((s,i)=>s+i.rating,0)/r.length).toFixed(1):0; })();

  const handleSave = (data) => {
    if (editItem) { setItems(arr=>arr.map(i=>i.id===editItem.id?{...i,...data}:i)); showToast(`${isMovie?"Movie":"Book"} updated!`); }
    else { setItems(arr=>[...arr,{...data,id:generateId(),dateAdded:new Date().toISOString().slice(0,10)}]); showToast(`Added to your ${isMovie?"collection":"library"}!`); }
    setShowModal(false); setEditItem(null);
  };
  const handleDelete = (id) => { setItems(arr=>arr.filter(i=>i.id!==id)); showToast(`${isMovie?"Movie":"Book"} removed`,"info"); };
  const handleToggle = (id) => {
    setItems(arr=>arr.map(i=>{ if(i.id!==id) return i;
      const ns=i.status===doneStatus?pendingStatus:doneStatus;
      showToast(ns===doneStatus?(isMovie?"Marked as watched! 🎬":"Marked as read! 🎉"):`Added to ${isMovie?"watchlist":"wishlist"}`);
      return {...i,status:ns,rating:ns===pendingStatus?0:i.rating};
    }));
  };

  const handleExport = () => {
    const data = items.map(i=>({ Title:i.title, [isMovie?"Director":"Author"]:isMovie?i.director:i.author, Genre:i.genre, Status:i.status, Rating:i.rating||"", Notes:i.note, "Date Added":i.dateAdded }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"]=[{wch:40},{wch:25},{wch:20},{wch:12},{wch:8},{wch:50},{wch:14}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isMovie?"BookWorm Movies":"BookWorm Books");
    XLSX.writeFile(wb, isMovie?"BookWorm_Movies.xlsx":"BookWorm_Books.xlsx");
    showToast(`${isMovie?"Movies":"Library"} exported!`);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    const genres = isMovie ? MOVIE_GENRES : BOOK_GENRES;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result,{type:"binary"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        const imported = rows.filter(r=>r.Title).map(r=>({
          id:generateId(), title:String(r.Title||"").trim(),
          ...(isMovie?{director:String(r.Director||"Unknown").trim()}:{author:String(r.Author||"Unknown").trim()}),
          genre:genres.includes(r.Genre)?r.Genre:genres[0],
          status:[doneStatus,pendingStatus].includes(r.Status)?r.Status:doneStatus,
          rating:Number(r.Rating)||0, note:String(r.Notes||""),
          dateAdded:r["Date Added"]||new Date().toISOString().slice(0,10),
        }));
        setItems(arr=>{ const t=new Set(arr.map(i=>i.title.toLowerCase())); return [...arr,...imported.filter(i=>!t.has(i.title.toLowerCase()))]; });
        showToast(`Imported ${imported.length} ${isMovie?"movies":"books"}!`);
      } catch { showToast("Failed to import file","error"); }
    };
    reader.readAsBinaryString(file); e.target.value="";
  };

  const usedGenres = ["All",...Array.from(new Set(items.map(i=>i.genre))).sort()];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} body{background:#F0E8D8}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
        @keyframes bookIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#F0E8D8} ::-webkit-scrollbar-thumb{background:#C9A84C88;border-radius:3px}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238B6B50' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important}
      `}</style>

      <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#EFE4C8 0%,#E8DBC4 40%,#DDD0B4 100%)", fontFamily:"'Lora',serif" }}>
        <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,opacity:0.4,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:920, margin:"0 auto", padding:"0 16px 60px" }}>

          {/* Header */}
          <header style={{ padding:"32px 0 20px", textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:8 }}>
              <div style={{ width:52,height:52,background:"linear-gradient(135deg,#8B1A1A,#6B1414)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 16px rgba(139,26,26,0.3)" }}>
                {isMovie?"🎬":"📚"}
              </div>
              <div style={{ textAlign:"left" }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:"#2C1810",letterSpacing:"-0.02em",lineHeight:1 }}>
                  Book<span style={{color:"#8B1A1A"}}>Worm</span>
                </h1>
                <p style={{ fontFamily:"'Lora',serif",fontSize:12,color:"#8B6B50",fontStyle:"italic",letterSpacing:"0.08em",marginTop:2 }}>
                  your personal {isMovie?"movie vault":"reading sanctuary"}
                </p>
              </div>
            </div>

            {/* Section Switcher */}
            <div style={{ display:"inline-flex",background:"rgba(255,255,255,0.55)",borderRadius:40,padding:4,border:"1px solid rgba(201,168,76,0.25)",marginBottom:16,backdropFilter:"blur(6px)",gap:4 }}>
              {[{key:"books",label:"Books",icon:"📚"},{key:"movies",label:"Movies",icon:"🎬"}].map(s=>(
                <button key={s.key} onClick={()=>switchSection(s.key)}
                  style={{ padding:"8px 24px",borderRadius:36,border:"none",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,background:section===s.key?"linear-gradient(135deg,#8B1A1A,#6B1414)":"transparent",color:section===s.key?"#F5EDD8":"#6B4A2A",boxShadow:section===s.key?"0 3px 12px rgba(139,26,26,0.25)":"none",transition:"all 0.25s",display:"flex",alignItems:"center",gap:7 }}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>

            {/* Decorative rule */}
            <div style={{ display:"flex",alignItems:"center",gap:12,margin:"0 auto 16px",maxWidth:300 }}>
              <div style={{ flex:1,height:1,background:"linear-gradient(90deg,transparent,#C9A84C)" }} />
              <span style={{ color:"#C9A84C",fontSize:14 }}>✦</span>
              <div style={{ flex:1,height:1,background:"linear-gradient(90deg,#C9A84C,transparent)" }} />
            </div>

            {/* Stats */}
            <div style={{ display:"flex",justifyContent:"center",gap:20,flexWrap:"wrap" }}>
              {[
                {label:isMovie?"Watched":"Books Read",value:doneCount,color:"#8B1A1A"},
                {label:isMovie?"Watchlist":"Wishlist",value:pendingCount,color:"#4A6B8A"},
                {label:"Avg Rating",value:avgRating>0?`${avgRating}★`:"—",color:"#8B6B1A"},
                {label:isMovie?"Total Movies":"Total Books",value:items.length,color:"#4A6B4A"},
              ].map(s=>(
                <div key={s.label} style={{ textAlign:"center",background:"rgba(255,255,255,0.45)",padding:"10px 18px",borderRadius:10,border:"1px solid rgba(201,168,76,0.2)",backdropFilter:"blur(4px)" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10,color:"#8B6B50",letterSpacing:"0.06em",textTransform:"uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </header>

          {/* Toolbar */}
          <div style={{ background:"rgba(255,255,255,0.6)",backdropFilter:"blur(8px)",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid rgba(201,168,76,0.2)",boxShadow:"0 2px 12px rgba(44,24,16,0.06)" }}>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
              <div style={{ position:"relative",flex:"1 1 200px" }}>
                <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#8B6B50",fontSize:14 }}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${isMovie?"movies or directors":"books or authors"}...`}
                  style={{ width:"100%",padding:"8px 10px 8px 32px",border:"1.5px solid #D4C5A0",borderRadius:8,fontFamily:"'Lora',serif",fontSize:13,background:"#FEFCF5",color:"#2C1810",outline:"none" }} />
              </div>
              <select value={filterGenre} onChange={e=>setFilterGenre(e.target.value)}
                style={{ padding:"8px 28px 8px 12px",border:"1.5px solid #D4C5A0",borderRadius:8,fontFamily:"'Lora',serif",fontSize:12,background:"#FEFCF5",color:"#2C1810",cursor:"pointer",flexShrink:0 }}>
                {usedGenres.map(g=><option key={g}>{g}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ padding:"8px 28px 8px 12px",border:"1.5px solid #D4C5A0",borderRadius:8,fontFamily:"'Lora',serif",fontSize:12,background:"#FEFCF5",color:"#2C1810",cursor:"pointer",flexShrink:0 }}>
                <option value="dateAdded">Latest Added</option>
                <option value="title">Title A–Z</option>
                <option value="person">{isMovie?"Director A–Z":"Author A–Z"}</option>
                <option value="rating">Top Rated</option>
              </select>
              <div style={{ width:1,height:32,background:"#D4C5A0",flexShrink:0 }} />
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleImport} />
              <button onClick={()=>fileInputRef.current?.click()} style={{ padding:"8px 14px",background:"transparent",border:"1.5px solid #8BA8C9",borderRadius:8,cursor:"pointer",fontFamily:"'Lora',serif",fontSize:12,color:"#4A6B8A",display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>⇪ Import</button>
              <button onClick={handleExport} style={{ padding:"8px 14px",background:"transparent",border:"1.5px solid #8BAA8A",borderRadius:8,cursor:"pointer",fontFamily:"'Lora',serif",fontSize:12,color:"#4A7A4A",display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>⇩ Export</button>
              <button onClick={()=>{setEditItem(null);setShowModal(true);}}
                style={{ padding:"8px 18px",background:"linear-gradient(135deg,#8B1A1A,#6B1414)",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:13,color:"#F5EDD8",fontWeight:700,boxShadow:"0 3px 12px rgba(139,26,26,0.25)",display:"flex",alignItems:"center",gap:6,flexShrink:0,whiteSpace:"nowrap",transition:"all 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                + Add {isMovie?"Movie":"Book"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",gap:0,marginBottom:20 }}>
            {[
              {key:"done",label:isMovie?"Watched":"Reading List",icon:isMovie?"🎬":"📖",count:doneCount},
              {key:"pending",label:isMovie?"Watchlist":"Wishlist",icon:isMovie?"🍿":"✨",count:pendingCount},
            ].map((tab,idx)=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                style={{ flex:1,padding:"12px 16px",background:activeTab===tab.key?"linear-gradient(135deg,#8B1A1A,#6B1414)":"rgba(255,255,255,0.5)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:idx===0?"10px 0 0 10px":"0 10px 10px 0",cursor:"pointer",fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:activeTab===tab.key?"#F5EDD8":"#6B4A2A",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.25s",boxShadow:activeTab===tab.key?"0 4px 16px rgba(139,26,26,0.25)":"none" }}>
                <span>{tab.icon}</span>{tab.label}
                <span style={{ background:activeTab===tab.key?"rgba(255,255,255,0.2)":"rgba(139,26,26,0.1)",color:activeTab===tab.key?"#F5EDD8":"#8B1A1A",borderRadius:20,padding:"1px 8px",fontSize:11 }}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length===0 ? (
            <div style={{ textAlign:"center",padding:"60px 20px",background:"rgba(255,255,255,0.4)",borderRadius:12,border:"2px dashed #D4C5A0" }}>
              <div style={{ fontSize:48,marginBottom:12 }}>{activeTab==="done"?(isMovie?"🎬":"📚"):(isMovie?"🍿":"✨")}</div>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:"#6B4A2A",marginBottom:6 }}>
                {search||filterGenre!=="All" ? `No ${isMovie?"movies":"books"} match your filters` : activeTab==="done" ? `Your ${isMovie?"watched list":"reading list"} is empty` : `Your ${isMovie?"watchlist":"wishlist"} is empty`}
              </h3>
              <p style={{ color:"#8B6B50",fontSize:13,fontStyle:"italic" }}>
                {search||filterGenre!=="All" ? "Try adjusting your search or filters" : `Click "+ Add ${isMovie?"Movie":"Book"}" to get started`}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12 }}>
              {filtered.map((item,i)=>(
                <div key={item.id} style={{ animation:"bookIn 0.3s ease both",animationDelay:`${i*0.04}s` }}>
                  <ItemCard item={item} isMovie={isMovie} onEdit={it=>{setEditItem(it);setShowModal(true);}} onDelete={handleDelete} onToggleStatus={handleToggle} />
                </div>
              ))}
            </div>
          )}

          {filtered.length>0 && (
            <p style={{ textAlign:"center",marginTop:16,fontSize:11,color:"#8B6B50",fontStyle:"italic",fontFamily:"'Lora',serif",letterSpacing:"0.04em" }}>
              Showing {filtered.length} of {items.filter(i=>i.status===tabStatus).length} {activeTab==="done"?(isMovie?"movies watched":"books read"):(isMovie?"watchlist movies":"wishlist books")}
            </p>
          )}

          {/* Footer */}
          <footer style={{ textAlign:"center",marginTop:40,paddingTop:20,borderTop:"1px solid #D4C5A088" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:6 }}>
              <div style={{ flex:1,height:1,background:"linear-gradient(90deg,transparent,#C9A84C66)" }} />
              <span style={{ color:"#C9A84C",fontSize:12 }}>✦  BookWorm  ✦</span>
              <div style={{ flex:1,height:1,background:"linear-gradient(90deg,#C9A84C66,transparent)" }} />
            </div>
            <p style={{ fontSize:11,color:"#B0967C",fontStyle:"italic" }}>
              {isMovie?"Every film is a window into another world.":"Every book is a new adventure waiting to unfold."}
            </p>
          </footer>
        </div>

        {/* Modal */}
        {showModal && (
          <Modal title={editItem?`Edit ${isMovie?"Movie":"Book"}`:`Add a New ${isMovie?"Movie":"Book"}`} icon={isMovie?"🎬":"📖"} onClose={()=>{setShowModal(false);setEditItem(null);}}>
            <ItemForm initial={editItem} isMovie={isMovie} onSave={handleSave} onClose={()=>{setShowModal(false);setEditItem(null);}} />
          </Modal>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed",bottom:24,right:24,background:toast.type==="error"?"#8B1A1A":toast.type==="info"?"#4A6B8A":"#4A7A4A",color:"#fff",padding:"12px 20px",borderRadius:10,fontFamily:"'Lora',serif",fontSize:13,boxShadow:"0 6px 20px rgba(0,0,0,0.2)",animation:"toastIn 0.3s ease",zIndex:2000,maxWidth:300 }}>
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
