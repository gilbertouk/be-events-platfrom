import { type CreateEventInput } from "../../usecases/createEvent/CreateEventInput";
import { type DeleteEventInput } from "../../usecases/deleteEvent/DeleteEventInput";
import { type FetchEventsInput } from "../../usecases/fetchEvents/FetchEventsInput";
import { type SelectByIdEventInput } from "../../usecases/selectEventById/SelectByIdEventInput";
import { type FetchEventsOutput } from "../../usecases/fetchEvents/FetchEventsOutput";
import { type IEvent } from "../models/Event";
import { database } from "../../infrastructure/database/";
import { StrikeService } from "../../infrastructure/stripe/service";

const strikeService = new StrikeService();

export class EventService {
  async create(event: CreateEventInput): Promise<IEvent | null> {
    try {
      const category = await database.category.findUnique({
        where: { id: event.categoryId },
      });

      if (!category) {
        return null;
      }

      let result;
      if (event.price !== "Free") {
        let formattedPrice: string;

        if (event.price.includes(".")) {
          const arrayPrice = event.price.split(".");
          arrayPrice[1].length === 1
            ? (formattedPrice = arrayPrice[0] + (arrayPrice[1] + "0"))
            : (formattedPrice = arrayPrice[0] + arrayPrice[1]);
        } else {
          formattedPrice = event.price + "00";
        }

        result = await strikeService.createProduct({
          name: event.name,
          description: event.description,
          default_price_data: {
            currency: "gbp",
            unit_amount_decimal: formattedPrice,
          },
          images: [event.logoUrl],
        });
      }

      const eventModel = await database.event.create({
        data: {
          name: event.name,
          dateStart: event.dateStart,
          dateEnd: event.dateEnd,
          city: event.city,
          address: event.address,
          postcode: event.postcode,
          country: event.country,
          categoryId: event.categoryId,
          price: event.price,
          description: event.description,
          userId: event.userId,
          capacity: event.capacity,
          logoUrl: event.logoUrl,
          information: event.information,
          priceStripeId: result?.priceStripeId,
          prodStripeId: result?.prodStripeId,
        },
      });
      return eventModel;
    } catch (error) {
      throw new Error();
    }
  }

  async delete(input: DeleteEventInput): Promise<IEvent | string> {
    try {
      const eventToDelete = await database.event.findUnique({
        where: { id: input.id },
      });

      if (!eventToDelete) {
        return "Event not found";
      }

      const orderModel = await database.order.findMany({
        where: { eventId: input.id },
      });

      if (orderModel.length > 0) {
        return "Event cannot be deleted because a ticket has already been sold";
      }

      const eventModel = await database.event.delete({
        where: { id: input.id },
      });

      return eventModel;
    } catch (error) {
      throw new Error();
    }
  }

  async fetchAll(input: FetchEventsInput): Promise<FetchEventsOutput> {
    try {
      let filter: any = {};
      const arrayQuery: any[] = [];

      if (input.name) {
        filter = {
          name: {
            contains: input.name,
            mode: "insensitive",
          },
        };

        arrayQuery.push(filter);
      }

      if (input.city) {
        filter = {
          city: {
            contains: input.city,
            mode: "insensitive",
          },
        };

        arrayQuery.push(filter);
      }

      if (input.category) {
        const category = await database.category.findFirst({
          where: {
            name: {
              contains: input.category,
              mode: "insensitive",
            },
          },
        });

        if (category) {
          filter = {
            categoryId: category.id,
          };

          arrayQuery.push(filter);
        }
      }

      const events = await database.event.findMany({
        where: {
          dateStart: {
            gte: new Date(),
          },
          AND: arrayQuery,
        },
        include: {
          category: true,
        },
        orderBy: {
          dateStart: "asc",
        },
        take: input.limit,
        skip: (input.page - 1) * input.limit,
      });

      const _count = await database.event.count({
        where: {
          dateStart: {
            gte: new Date(),
          },
          AND: arrayQuery,
        },
      });

      return { events, _count };
    } catch (error) {
      throw new Error();
    }
  }

  async selectByIdEvent(input: SelectByIdEventInput): Promise<IEvent | null> {
    try {
      const event = await database.event.findUnique({
        where: { id: input.id, dateStart: { gte: new Date() } },
      });

      if (event) {
        await database.event.update({
          where: { id: input.id },
          data: {
            viewCount: event.viewCount + 1,
          },
        });
      }

      return event;
    } catch (error) {
      throw new Error();
    }
  }

  async fetchTrending(): Promise<IEvent[]> {
    try {
      const events = await database.event.findMany({
        where: {
          dateStart: {
            gte: new Date(),
          },
        },
        orderBy: [{ viewCount: "desc" }, { dateStart: "asc" }],
        take: 6,
      });

      return events;
    } catch (error) {
      throw new Error();
    }
  }

  async fetchEventsCities(): Promise<string[]> {
    try {
      const eventsCities = await database.event.groupBy({
        by: ["city"],
        where: {
          dateStart: {
            gte: new Date(),
          },
        },
      });

      const arrayCities = eventsCities.map((event) => event.city).sort();

      return arrayCities;
    } catch (error) {
      throw new Error();
    }
  }
}
