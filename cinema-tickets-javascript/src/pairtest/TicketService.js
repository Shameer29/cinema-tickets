import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

const PRICES = {
  INFANT: 0,
  CHILD: 15,
  ADULT: 25,
}; 

const MAX_TICKETS = 25;

export default class TicketService {
  #paymentService;
  #seatService;

  constructor(
    paymentService = new TicketPaymentService(),
    seatService = new SeatReservationService()
  ) {
    this.#paymentService = paymentService;
    this.#seatService = seatService;
  }

  purchaseTickets(accountId, ...requests) {
    this.#validateAccount(accountId);
    this.#validateRequests(requests);

    const counts = this.#getCounts(requests);

    this.#checkBusinessRules(counts);

    const total = this.#getTotal(counts);
    const seats = counts.ADULT + counts.CHILD; // infants don't get seats

    this.#paymentService.makePayment(accountId, total);
    this.#seatService.reserveSeat(accountId, seats);
  }

  #validateAccount(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Invalid account id');
    }
  }

  #validateRequests(requests) {
    if (!requests.length) {
      throw new InvalidPurchaseException('No tickets requested');
    }
    for (const req of requests) {
      if (!(req instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('Invalid request type');
      }
      if (req.getNoOfTickets() <= 0) {
        throw new InvalidPurchaseException('Ticket count must be greater than 0');
      }
    }
  }

  #getCounts(requests) {
    const counts = { ADULT: 0, CHILD: 0, INFANT: 0 };
    for (const req of requests) {
      const type = req.getTicketType();
      if (!counts.hasOwnProperty(type)) {
        throw new InvalidPurchaseException('Unknown ticket type');
      }
      counts[type] += req.getNoOfTickets();
    }
    return counts;
  }

  #checkBusinessRules(counts) {
    const total = counts.ADULT + counts.CHILD + counts.INFANT;

    if (total > MAX_TICKETS) {
      throw new InvalidPurchaseException('Too many tickets');
    }

    if (counts.ADULT === 0 && (counts.CHILD > 0 || counts.INFANT > 0)) {
      throw new InvalidPurchaseException('Must have at least one adult');
    }

    if (counts.INFANT > counts.ADULT) {
      throw new InvalidPurchaseException('Each infant needs an adult');
    }
  }

  #getTotal(counts) {
    let total = 0;
    for (const type in counts) {
      total += PRICES[type] * counts[type];
    }
    return total;
  }
}
