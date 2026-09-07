import { Routes, Route, Link, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddBottlePage from "./pages/AddBottlePage";
import EditBottlePage from "./pages/EditBottlePage";
import GroceryDashboard from "./pages/GroceryDashboard";
import AddGroceryItemPage from "./pages/AddGroceryItemPage";
import EditGroceryItemPage from "./pages/EditGroceryItemPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import "./styles.css";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-emoji">🏠</span> Household Spirits and Groceries Inventory
        </Link>
        <nav>
          <NavLink to="/" end>
            Inventory
          </NavLink>
          <NavLink to="/add">Add bottle</NavLink>
          <span className="nav-divider" aria-hidden="true" />
          <NavLink to="/groceries" end>
            Groceries
          </NavLink>
          <NavLink to="/groceries/add">Add item</NavLink>
          <NavLink to="/groceries/list">Shopping list</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddBottlePage />} />
          <Route path="/edit/:id" element={<EditBottlePage />} />

          <Route path="/groceries" element={<GroceryDashboard />} />
          <Route path="/groceries/add" element={<AddGroceryItemPage />} />
          <Route path="/groceries/edit/:id" element={<EditGroceryItemPage />} />
          <Route path="/groceries/list" element={<ShoppingListPage />} />
        </Routes>
      </main>
    </div>
  );
}
