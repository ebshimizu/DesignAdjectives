import { createStore } from '../backend/parameter-store';
import Backend from '../backend/compositor';

// the default parameter store is the compositor backend
// the actual backend is detected when a compatible file gets loaded
const paramStore = createStore(Backend, 'compositor');

export default paramStore;
