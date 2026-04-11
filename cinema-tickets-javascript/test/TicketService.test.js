import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import TicketService from '../src/pairtest/TicketService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js'; 
 
// simple reusable mocks
const paymentServiceMock = { makePayment: jest.fn() };
const seatServiceMock = { reserveSeat: jest.fn() };

// helper to create service
const createService = () => new TicketService(paymentServiceMock, seatServiceMock);


const ticket = (type, count) => new TicketTypeRequest(type, count);

describe('TicketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account validation', () => {
    test('rejects invalid account IDs', () => {
      const service = createService();

      expect(() => service.purchaseTickets(0, ticket('ADULT', 1)))
        .toThrow(InvalidPurchaseException);

      expect(() => service.purchaseTickets(-1, ticket('ADULT', 1)))
        .toThrow(InvalidPurchaseException);

      expect(() => service.purchaseTickets('abc', ticket('ADULT', 1)))
        .toThrow(InvalidPurchaseException);
    });

    test('accepts a valid account ID', () => {
      expect(() => createService().purchaseTickets(1, ticket('ADULT', 1)))
        .not.toThrow();
    });
  });

  describe('Request validation', () => {
    test('requires at least one ticket request', () => {
      expect(() => createService().purchaseTickets(1))
        .toThrow(InvalidPurchaseException);
    });

    test('rejects invalid request objects', () => {
      expect(() => createService().purchaseTickets(1, { type: 'ADULT', noOfTickets: 1 }))
        .toThrow(InvalidPurchaseException);
    });

    test('rejects zero or negative ticket counts', () => {
      expect(() => createService().purchaseTickets(1, ticket('ADULT', 0)))
        .toThrow(InvalidPurchaseException);
    });
  });

  describe('Business rules', () => {
    test('max ticket limit (25)', () => {
      expect(() => createService().purchaseTickets(1,
        ticket('ADULT', 20),
        ticket('CHILD', 6)
      )).toThrow(InvalidPurchaseException);

      expect(() => createService().purchaseTickets(1,
        ticket('ADULT', 15),
        ticket('CHILD', 10)
      )).not.toThrow();
    });

    test('requires at least one adult ticket', () => {
      expect(() => createService().purchaseTickets(1, ticket('CHILD', 2)))
        .toThrow(InvalidPurchaseException);

      expect(() => createService().purchaseTickets(1, ticket('INFANT', 1)))
        .toThrow(InvalidPurchaseException);
    });

    test('infants cannot exceed number of adults', () => {
      expect(() => createService().purchaseTickets(1,
        ticket('ADULT', 1),
        ticket('INFANT', 2)
      )).toThrow(InvalidPurchaseException);

      expect(() => createService().purchaseTickets(1,
        ticket('ADULT', 2),
        ticket('INFANT', 2)
      )).not.toThrow();
    });
  });

  describe('Payment calculation', () => {
    test('calculates simple purchases correctly', () => {
      createService().purchaseTickets(1, ticket('ADULT', 1));
      expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 25);

      createService().purchaseTickets(1,
        ticket('ADULT', 1),
        ticket('CHILD', 1)
      );
      expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 40);
    });

    test('does not charge for infants', () => {
      createService().purchaseTickets(1,
        ticket('ADULT', 1),
        ticket('INFANT', 1)
      );
      expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 25);
    });

    test('handles mixed ticket types', () => {
      createService().purchaseTickets(1,
        ticket('ADULT', 2),
        ticket('CHILD', 3),
        ticket('INFANT', 1)
      );
      expect(paymentServiceMock.makePayment).toHaveBeenCalledWith(1, 95);
    });
  });

  describe('Seat reservation', () => {
    test('reserves seats only for adults and children', () => {
      createService().purchaseTickets(1, ticket('ADULT', 3));
      expect(seatServiceMock.reserveSeat).toHaveBeenCalledWith(1, 3);

      createService().purchaseTickets(1,
        ticket('ADULT', 2),
        ticket('CHILD', 2),
        ticket('INFANT', 2)
      );
      expect(seatServiceMock.reserveSeat).toHaveBeenCalledWith(1, 4);
    });
  });

  describe('External service interaction', () => {
    test('calls payment and reservation services on success', () => {
      createService().purchaseTickets(1, ticket('ADULT', 1));

      expect(paymentServiceMock.makePayment).toHaveBeenCalledTimes(1);
      expect(seatServiceMock.reserveSeat).toHaveBeenCalledTimes(1);
    });

    test('doesnt call services when validation fails', () => {
      expect(() => createService().purchaseTickets(1, ticket('CHILD', 1)))
        .toThrow(InvalidPurchaseException);

      expect(paymentServiceMock.makePayment).not.toHaveBeenCalled();
      expect(seatServiceMock.reserveSeat).not.toHaveBeenCalled();
    });

    test('passes account ID correctly to services', () => {
      createService().purchaseTickets(42, ticket('ADULT', 1));

      expect(paymentServiceMock.makePayment)
        .toHaveBeenCalledWith(42, expect.any(Number));

      expect(seatServiceMock.reserveSeat)
        .toHaveBeenCalledWith(42, expect.any(Number));
    });
  });
});
