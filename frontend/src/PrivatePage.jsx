import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Modal, Button } from "react-bootstrap";
import Loading from "./Loading";

const API_URL = import.meta.env.VITE_API_URL;

const PrivatePage = () => {
  const [inventory, setInventory] = useState([]);
  // Commented out for now because the inventory needs some localstorage refresh logic as well.
  // const [stagedItems, setStagedItems] = useState(() => {
  //   const saved = localStorage.getItem("stagedItems");
  //   return saved ? JSON.parse(saved) : [];
  // });
  const [stagedItems, setStagedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // useEffect(() => {
  //   localStorage.setItem("inventory", JSON.stringify(inventory));
  // }, [inventory])

  // useEffect(() => {
  //   // Store staged items in localStorage whenever they update
  //   localStorage.setItem("stagedItems", JSON.stringify(stagedItems));
  // }, [stagedItems]);

  useEffect(() => {
    const fetchInventory = async () => {
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/inventory`, {
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
      const response = await fetch(`${API_URL}/submit`, {
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
    stagedItems.forEach((item) => {
      setInventory((prev) =>
        prev.map((inv) =>
          inv.id === item.id ? { ...inv, quantity: inv.quantity + item.quantity } : inv
        )
      );
    })
    setStagedItems([]);
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const confirmSubmit = () => {
    handleSubmit();
    handleCloseModal();
  };

  // Render Helper Functions
  function renderStagedItem(item) {
    return (
      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
        {item.name} - {item.quantity}
        <button className="btn btn-warning btn-sm" onClick={() => handleUnstageItem(item)}>Remove</button>
      </li>
    );
  }

  if (loading) return <Loading />; // can update to pass a message
  if (submitting) return <Loading />; // can update to pass a message

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Cookie Counter</h1>

      <div className="row gy-4">
        {/* Inventory Column */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center mb-3">Available Inventory</h2>
              <ul className="list-group">
                {inventory.map((item) => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {item.name} - {item.quantity}
                    <button className="btn btn-primary btn-sm" onClick={() => handleStageItem(item)} disabled={item.quantity === 0}>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Staged Items Column */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center mb-3">Staged Cookies</h2>
              <ul className="list-group">
                {stagedItems.length > 0 ? stagedItems.map(renderStagedItem) : <span className="text-muted">No Cookies Here! Click the Add buttons to stage some cookies.</span>}
              </ul>
            </div>
            <Modal show={showModal} onHide={handleCloseModal} centered>
              <Modal.Header closeButton>
                <Modal.Title>Confirm Submission</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Are you sure you want to submit the staged cookies?
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="primary" onClick={confirmSubmit}>Confirm</Button>
              </Modal.Footer>
            </Modal>
            <div className="card-footer d-flex mt-2 justify-content-center">
              {/* Buttons Section */}
              <button className="btn btn-success mx-2" onClick={handleShowModal} disabled={stagedItems.length === 0 || submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-danger mx-2" onClick={handleClearStagedItems} disabled={stagedItems.length === 0 || submitting}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default PrivatePage;