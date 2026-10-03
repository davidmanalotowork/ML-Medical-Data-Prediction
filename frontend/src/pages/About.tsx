import React from 'react';
import { Info, Heart, Award, Mail, Clock, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About the Tool</h1>
          <p className="text-gray-600">
            Learn how the clinical risk prediction workflow works and how to use it effectively
          </p>
        </div>

        <Card className="mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold text-gray-900">
              <Info className="w-6 h-6 text-green-600" />
              About the System
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What This Tool Does</h3>
              <p className="text-gray-700 leading-relaxed">
                This clinical risk prediction tool evaluates patient information to estimate the likelihood
                of a negative outcome or readmission risk. It considers multiple factors such as patient
                demographics, diagnoses, procedures, medications, and clinical indicators to generate a
                risk assessment and supporting recommendations.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  "Upload a CSV or Excel file, or enter patient details manually",
                  "The model analyzes the provided clinical and demographic factors",
                  "Review the risk score, key contributors, and recommended next steps",
                  "Review the result and download a report for later reference",
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </section>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          { }
          <Card className="h-full hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Award className="w-6 h-6 text-purple-600" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Accurate Predictions",
                    desc: "94%+ accuracy in predicting readmission risk",
                    color: "blue",
                  },
                  {
                    title: "Real-time Analysis",
                    desc: "Instant risk assessment for timely interventions",
                    color: "green",
                  },
                  {
                    title: "Easy Integration",
                    desc: "Upload Excel files or enter data manually",
                    color: "purple",
                  },
                  {
                    title: "Comprehensive Reports",
                    desc: "Detailed analytics and trend visualization",
                    color: "orange",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg bg-${feature.color}-50 border border-${feature.color}-100 hover:shadow-sm transition`}
                  >
                    <h4 className={`font-semibold text-${feature.color}-900 mb-1`}>
                      {feature.title}
                    </h4>
                    <p className={`text-sm text-${feature.color}-700`}>
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          { }
          <Card className="h-full hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold ">
                <Heart className="w-6 h-6 text-red-600" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    num: "1",
                    title: "Improved Patient Outcomes",
                    desc: "Early identification of high-risk patients enables proactive care",
                    color: "red",
                  },
                  {
                    num: "2",
                    title: "Reduced Healthcare Costs",
                    desc: "Lower readmission rates mean reduced costs for hospitals and patients",
                    color: "blue",
                  },
                  {
                    num: "3",
                    title: "Enhanced Decision Making",
                    desc: "Data-driven insights support better clinical decisions",
                    color: "green",
                  },
                  {
                    num: "4",
                    title: "Resource Optimization",
                    desc: "Allocate healthcare resources more effectively",
                    color: "purple",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full bg-${benefit.color}-100 flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <span className={`text-${benefit.color}-600 font-bold text-sm`}>
                        {benefit.num}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Phone className="w-6 h-6 text-blue-600" />
              Get in Touch
            </CardTitle>
            <CardDescription className="text-gray-600">
              Have questions? We're here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <p className="font-medium text-gray-900">Email</p>
                  </div>
                  <p className="text-sm text-gray-800 pl-8">support@readmissions.com</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100 h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-gray-900">Support Hours</p>
                  </div>
                  <p className="text-sm text-gray-800 pl-8">
                    Monday – Friday, 9:00 AM – 6:00 PM (PHT)
                  </p>
                  <p className="text-sm text-gray-600 pl-8">
                    Responses may take up to 24 hours during weekends.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 pt-3 border-t leading-relaxed">
                For technical support or questions about using the system, please contact our support team
                or refer to the documentation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
