import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";

export default function PollPage() {
  const router = useRouter();
  const { id } = router.query;

  const [poll, setPoll] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [votingClosed, setVotingClosed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false); // For showing "Link copied to clipboard"

  useEffect(() => {
    if (!id) return;

    const fetchPoll = async () => {
      const pollRef = doc(db, "polls", id);
      const pollSnap = await getDoc(pollRef);
      if (pollSnap.exists()) {
        setPoll(pollSnap.data());
      }
      setLoading(false);
    };

    fetchPoll();
  }, [id]);

  useEffect(() => {
    if (!poll?.createdAt?.toDate) return;
    const createdAt = poll.createdAt.toDate();
    const deadline = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date();
      const diff = deadline - now;
      if (diff <= 0) {
        setVotingClosed(true);
        setTimeLeft("Voting has closed");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left to vote`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  const handleVoteChange = (date, value) => {
    setVotes((prev) => ({ ...prev, [date]: value }));
  };

  const handleSubmit = async () => {
    if (!name || !email || !phone || Object.keys(votes).length === 0) {
      alert("Please enter all fields and select your availability.");
      return;
    }
    const voteData = {
      name,
      email,
      phone,
      votes,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "polls", id, "votes"), voteData);
    router.push(`/results/${id}`);
  };

  const pollUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000); // Reset after 2 seconds
  };

  const share = (platform) => {
    if (platform === "copy") {
      navigator.clipboard.writeText(pollUrl); // Copy the link to clipboard
      alert("Link copied to clipboard!"); // Display the alert for copying the link
    } else if (platform === "whatsapp") {
      const message = `Hey you are invited for an ${poll.title} evening out in ${poll.location}! Vote on what day suits you now! ${pollUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    } else if (platform === "discord") {
      window.open(`https://discord.com/channels/@me`, "_blank");
    } else if (platform === "slack") {
      window.open("https://slack.com", "_blank");
    } else {
      window.open(pollUrl, "_blank"); // Default action (open the link directly)
    }
  };

  if (loading) return <p className="p-4">Loading poll...</p>;
  if (!poll) return <p className="p-4">Poll not found.</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
      <p className="text-sm text-gray-600 mb-2">Location: {poll.location}</p>

      {timeLeft && (
        <p className="text-xs text-blue-600 font-medium mb-2">⏳ {timeLeft}</p>
      )}

      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 mb-4 rounded text-center font-semibold">
        🎉 {poll.organiserFirstName || "Someone"} is planning an evening out — add which dates work for you!
      </div>

      <input
        type="text"
        placeholder="Your First Name and Last Name Initial (i.e Joe B)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      <input
        type="tel"
        placeholder="Your phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />
      <p className="text-xs text-gray-600 italic mb-4">
        We securely ask for your email and phone to make sure only real people are invited 😊
      </p>

      {poll.dates.map((date) => (
        <div key={date} className="border p-4 mb-4 rounded">
          <div className="font-semibold mb-2">
            {format(parseISO(date), "EEEE do MMMM yyyy")}
          </div>
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name={date} value="yes" onChange={() => handleVoteChange(date, "yes")} /> ✅ Can Attend
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name={date} value="maybe" onChange={() => handleVoteChange(date, "maybe")} /> 🤔 Maybe
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name={date} value="no" onChange={() => handleVoteChange(date, "no")} /> ❌ No
            </label>
          </div>
        </div>
      ))}

      {!votingClosed && (
        <button
          onClick={handleSubmit}
          className="bg-black text-white px-4 py-2 rounded w-full font-semibold"
        >
          Submit Votes
        </button>
      )}

      {/* Share Section */}
      <div className="mt-10 text-center">
        <h2 className="text-xl font-semibold mb-3">Share Event with Friends</h2>
        <div className="flex justify-center gap-4 items-center">
          <button onClick={() => share("whatsapp")} title="Share on WhatsApp">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" className="w-8 h-8" />
          </button>
          <button onClick={() => share("discord")} title="Share on Discord">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111370.png" alt="Discord" className="w-8 h-8" />
          </button>
          <button onClick={() => share("slack")} title="Share on Slack">
            <img src="https://cdn-icons-png.flaticon.com/512/2111/2111615.png" alt="Slack" className="w-8 h-8" />
          </button>
          <button onClick={() => share("copy")} title="Copy Link">
            <img src="https://cdn-icons-png.flaticon.com/512/1388/1388978.png" alt="Copy Link" className="w-8 h-8" />
          </button>
        </div>

        {/* Create Your Own Event Link */}
        <div className="mt-6 text-center">
          <a href="/" className="inline-flex items-center text-blue-600 font-semibold hover:underline">
            <img src="https://cdn-icons-png.flaticon.com/512/747/747310.png" alt="Calendar" className="w-5 h-5 mr-2" />
            Create Your Own Event
          </a>
        </div>
      </div>

      {/* Show link copied message */}
      {linkCopied && <p>Link copied to clipboard!</p>}
    </div>
  );
}
