export interface ResponseTemplate {
  id: string;
  label: string;
  template: string;
}

export const responseTemplates: ResponseTemplate[] = [
  {
    id: "politeDecline",
    label: "Polite decline",
    template:
      "Thank you for reaching out. I'm not pursuing new opportunities at the moment, but I appreciate your consideration.",
  },
  {
    id: "requestDetails",
    label: "Request for details",
    template:
      "Thanks for getting in touch. Could you share more details about the role and expectations?",
  },
  {
    id: "interested",
    label: "Interested",
    template:
      "The opportunity sounds interesting. I'd love to learn more and discuss how I might contribute.",
  },
];
