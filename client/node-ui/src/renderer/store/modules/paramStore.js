import { createStore } from '../backend/parameter-store';
import Backend from '../backend/substance';

// the default parameter store is the substance backend
// the actual backend is detected when a compatible file gets loaded
const paramStore = createStore(Backend, 'substance');

export default paramStore;
