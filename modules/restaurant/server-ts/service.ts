import RestaurantORM from './sql';

type CreateReviewProps = {

};

const ORM = new RestaurantORM();

class RestaurantService {
  // public createReview({ }) {

  // }

  public async customerCanAddReview(userId: number, restaurantId: number) {
    const existingReview = await ORM.getReviewFromUserAndRestaurantId(userId, restaurantId);
    return !existingReview;
  }
}

export default new RestaurantService();
