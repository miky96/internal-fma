import { getFirestore } from 'firebase/firestore';
import { app } from './firebaseSetup';

// Aquest mòdul només l'importen les rutes lazy (Inventory, AddTicket, EditProduct,
// ViewTickets). Així el bundler manté tota la SDK de Firestore fora del chunk inicial.
export const db = getFirestore(app);
