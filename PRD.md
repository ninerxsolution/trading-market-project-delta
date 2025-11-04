Create a functional prototype UI for a Roblox item trading marketplace using React and ReactState.

The app should simulate a simple trading platform where users can browse, post, and chat about in-game items.
It should look fun, friendly, and inspired by Roblox aesthetics — colorful cards, rounded shapes, and playful UI.
No backend is required; use mock data stored in React state.

---

### 🌐 Pages and Components

1. **Home Page (/)**  
   - A search bar at the top for finding items by name.  
   - A grid of sample item cards (image, name, rarity, average price).  
   - Clicking an item opens its detail modal.  
   - Display “Welcome, [username]” in the header when logged in.

2. **Item Detail Modal**  
   - Shows item name, image, description, and current average trade value.  
   - Add a section showing how many sellers currently list this item  
     (e.g., “7 users are selling this item”).  
   - Display a small list of the latest seller names or mock offers below the main item info.  
   - A button “Chat with Owner” that opens the chat bar with that user.

3. **Post Trade Page (/post)**  
   - A form to post a trade offer:  
     Fields: "Item You Have", "Item You Want", "Description", "Upload Image".  
   - Submitting the form adds the post to a list of trades (stored in local state).  
   - After posting, show a confirmation and return to Home.

4. **Persistent Chat Bar (like old Facebook Messenger)**  
   - Fixed chat panel at the bottom of the screen, visible on all pages.  
   - Users can open multiple chat tabs, each representing a different user.  
   - Each tab shows the username and last message preview.  
   - Chats use React state for mock messages (no backend).  
   - Allow minimizing or closing tabs individually.  
   - Style it similar to the classic Facebook Messenger layout — small chat boxes that can be expanded or collapsed.

5. **User Profile Page (/profile/:username)**  
   - Shows mock user info: avatar, username, join date, short bio.  
   - Lists that user’s active trade posts.  
   - Include a “Message” button that opens a chat tab with that user.

6. **Authentication Pages (mock only)**  
   - **Login Page:** username + password fields.  
   - **Register Page:** username, email, password, confirm password.  
   - Store the “logged-in user” in React state.  
   - After login, redirect to the Home page.  
   - Show “Logout” button in the navigation bar when logged in.

7. **Navigation Bar**  
   - Links: Home, Post Trade, Profile, and Login/Logout.  
   - Responsive layout (works on desktop and mobile).  
   - Use icons or playful buttons to match the Roblox-inspired look.

---

### ⚙️ Technical Requirements

- Use **React functional components** with **useState** and **useEffect** for all interactivity.  
- Use **React Router** for navigation.  
- Use **TailwindCSS** or similar modern styling system.  
- Use **mock JSON data** for items, users, and trade listings.  
- Keep everything local (no backend or external API calls).  
- Keep the interface **colorful, rounded, and Roblox-themed** — fun, not corporate.  
- Ensure the chat bar and navigation remain visible across all pages.  
- Make all components responsive and easy to understand.

---

### 🧱 Sample Data Ideas (optional)
Example items:
- “Iron Scrap”
- “Battery Pack”
- “Plasma Core”
- “Carbon Fiber Plate”
- “Nano Chip”

Example mock users:
- “BuilderMax”, “NoobMaster99”, “PixelCrafter”, “AgentFox”

---

### 🎯 Goal
Produce a playful, fully interactive prototype UI that:
- Lets users browse and view item details.  
- Allows posting new trade listings.  
- Supports mock login/register and user sessions.  
- Displays user profiles with trade listings.  
- Includes a persistent bottom chat bar that simulates direct messaging between users.  
- Demonstrates all features using React state only — no backend or APIs.

---

### ✨ Bonus Instruction
Style the chat bar to look like **classic Facebook Messenger tabs** — small user chat boxes that can be minimized or expanded at the bottom of the screen.
