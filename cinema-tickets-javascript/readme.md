1.Cinema Tickets

A JavaScript implementation of a cinema ticket purchasing service.

2.Ticket Types and Prices

| Ticket Type | Price |
|-------------|-------|
| Adult       | £25   |
| Child       | £15   |
| Infant      | £0    |

3.Installation

npm install

Running the Tests

npm test

4.Implementation Details

The `TicketService` validates every request before processing:

1. Checks the account ID is a valid positive integer
2. Checks at least one ticket has been requested
3. Checks all requests are valid `TicketTypeRequest` instances
4. Enforces all business rules
5. Calculates the total cost and calls `TicketPaymentService`
6. Calculates the total seats and calls `SeatReservationService`

Any invalid request throws an `InvalidPurchaseException`.
