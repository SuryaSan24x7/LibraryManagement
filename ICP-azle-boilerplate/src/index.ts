import { Canister, nat64, text, update, query, Variant } from 'azle';

type Book = {
    title: text;
    authorName: text;
    ISBN: text;
    totalCopies: nat64;
    availableCopies: nat64;
    readers: text[]; // List of person IDs who have taken the book
};

type Person = {
    id: text;
    name: text;
};

// Variant for the operation result
const OperationResult = Variant({
    Success: text,
    Failure: text,
});


let books: { [ISBN: string]: Book } = {};
let people: { [id: string]: Person } = {};
let issuedBooks: { [ISBN: string]: text[] } = {}; // Maps book ISBN to a list of person IDs

export default Canister({
    addBook: update([text, text, text, nat64], OperationResult, (title, authorName, ISBN, totalCopies) => {
        if (books[ISBN]) {
            return { Failure: "Book already exists" };
        }
        books[ISBN] = {
            title,
            authorName,
            ISBN,
            totalCopies,
            availableCopies: totalCopies,
            readers: [],
        };
        return { Success: `Book ${title} added successfully` };
    }),

    issueBook: update([text, text], OperationResult, (ISBN, personId) => {
        const book = books[ISBN];
        if (!book || book.availableCopies < 1n) {
            return { Failure: "Book not available" };
        }
        if (!people[personId]) {
            return { Failure: "Person not found" };
        }
        book.availableCopies -= 1n;
        if (!issuedBooks[ISBN]) {
            issuedBooks[ISBN] = [];
        }
        issuedBooks[ISBN].push(personId);
        book.readers.push(personId);
        return { Success: `Book ${ISBN} issued to ${personId}` };
    }),

    returnBook: update([text, text], OperationResult, (ISBN, personId) => {
        const book = books[ISBN];
        if (!book || !issuedBooks[ISBN] || !issuedBooks[ISBN].includes(personId)) {
            return { Failure: "This book was not issued to the given person" };
        }
        book.availableCopies += 1n;
        issuedBooks[ISBN] = issuedBooks[ISBN].filter(id => id !== personId);
        return { Success: `Book ${ISBN} returned by ${personId}` };
    }),

    incrementBookCopies: update([text, nat64], OperationResult, (ISBN, additionalCopies) => {
        const book = books[ISBN];
        if (!book) {
            return { Failure: "Book not found" };
        }
        book.totalCopies += additionalCopies;
        book.availableCopies += additionalCopies;
        return { Success: `Added ${additionalCopies} copies to book ${ISBN}` };
    }),
    getBookDetails: query([text], OperationResult, (ISBN) => {
      const book = books[ISBN];
      if (!book) {
          return { Failure : "Book not found"};
      }
  
      // Check if the book is available and construct an appropriate message
      const availabilityMessage = book.availableCopies > 0 
          ? `Book "${book.title}" by ${book.authorName} is Available.` 
          : `Book "${book.title}" by ${book.authorName} is Not Available.`;
  
      return {Success: availabilityMessage };
  }),
  
});
