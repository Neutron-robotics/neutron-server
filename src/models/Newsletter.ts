import {
  Document, Model, Schema, model
} from 'mongoose';

interface INewsletterSubscriber extends Document {
    email: string
}

const NewsletterSchema = new Schema<INewsletterSubscriber>({
  email: {
    type: String,
    required: true,
    unique: true
  }
});

const Newsletter = model<INewsletterSubscriber>('Newsletter', NewsletterSchema);

export default Newsletter;
