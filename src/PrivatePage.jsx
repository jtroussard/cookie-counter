import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PrivatePage = () => {
  const [inventory, setInventory] = useState([]);
  const [stagedItems, setStagedItems] = useState(() => {
    const saved = localStorage.getItem("stagedItems");
    return saved ? JSON.parse(saved) : [];
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Store staged items in localStorage whenever they update
    localStorage.setItem("stagedItems", JSON.stringify(stagedItems));
  }, [stagedItems]);

  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://localhost:5174/inventory", {
          headers: { Authorization: token },
        });

        const data = await response.json();

        if (response.ok) {
          setInventory(data);
        } else {
          setError(data.message || "Failed to load inventory");
        }
      } catch (err) {
        setError(`Server error, try again later: ${err}`);
        toast.error(`Server error, try again later: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [navigate]);

  const handleStageItem = (item) => {
    console.log(`Staging item: ${JSON.stringify(item)}`);
  
    setStagedItems((prev) => {
      const existingItem = prev.find((staged) => staged.id === item.id);
  
      if (existingItem) {
        return prev.map((staged) =>
          staged.id === item.id ? { ...staged, quantity: staged.quantity + 1 } : staged
        );
      } else {
        return [...prev, { id: item.id, name: item.name, quantity: 1 }];
      }
    });
  
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === item.id ? { ...inv, quantity: inv.quantity - 1 } : inv
      )
    );
  };

  const handleUnstageItem = (item) => {
    console.log(`Unstaging item: ${JSON.stringify(item)}`);
  
    setStagedItems((prev) =>
      prev.map((staged) =>
        staged.id === item.id ? { ...staged, quantity: staged.quantity - 1 } : staged
      ).filter((staged) => staged.quantity > 0)
    );
  
    setInventory((prev) =>
      prev.map((inv) =>
        inv.id === item.id ? { ...inv, quantity: inv.quantity + 1 } : inv
      )
    );
  };
  

  const handleSubmit = async () => {
    console.log(`Submitting staged items: ${JSON.stringify(stagedItems)}`);
    if (stagedItems.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5174/submit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("sessionToken")
        },
        body: JSON.stringify(stagedItems),
      });

      const data = await response.json();
      console.log(`Has the response returned yet??? ${JSON.stringify(data)}`);

      if (data.success) {
        console.log("[PrivatePage] Successfully submitted staged items");
        setStagedItems([]);
        toast.success("Items submitted successfully");
      } else {
        setError(data.message || "Failed to submit staged items");
        toast.error(data.message || "Failed to submit staged items");
      }
    } catch (err) {
      setError(`Server error, try again later: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearStagedItems = () => {
    setStagedItems([]);
  };

  if (loading) return <p>Loading inventory...</p>;
  if (submitting) return <p>Submitting staged items...</p>;

  return (
    <div>
      <h1>Currenty Inventory</h1>
      <ul>
        {inventory.map((item) => (
          <li key={item.id}>
            {item.name} - {item.quantity}
            <button className="btn btn-primary" onClick={() => handleStageItem(item)} disabled={item.quantity === 0}>Add</button>
          </li>
        ))}
      </ul>

      <h2>Staged Cookies</h2>
      <ul>
        {stagedItems.map((item) => (
          <li key={item.id}>
            {item.name} - {item.quantity}
            <button className="btn btn-warning" onClick={() => handleUnstageItem(item)}>Remove</button>
          </li>
        ))}
      </ul>
      <button className="btn btn-success" onClick={handleSubmit} disabled={stagedItems.length === 0 || submitting}>
        {loading ? "Saving..." : "Save"}
      </button>
      <button className="btn btn-danger" onClick={() => handleClearStagedItems()} disabled={stagedItems.length === 0 || submitting}>Reset</button>
    </div>
  );
};

export default PrivatePage;