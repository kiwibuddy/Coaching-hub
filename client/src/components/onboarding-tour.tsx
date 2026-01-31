import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step, EVENTS, ACTIONS } from "react-joyride";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingTourProps {
  role: "coach" | "client";
  tourCompleted?: boolean;
}

const COACH_STEPS: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    content: "Welcome to your coaching dashboard! Here you'll see an overview of your practice - upcoming sessions, pending intakes, and client activity.",
    disableBeacon: true,
    placement: "center",
  },
  {
    target: '[data-tour="clients"]',
    content: "Manage all your clients here. View their profiles, track progress, and access their session history.",
    placement: "right",
  },
  {
    target: '[data-tour="sessions"]',
    content: "Schedule and manage coaching sessions. You can set up meeting links, add notes, and track session status.",
    placement: "right",
  },
  {
    target: '[data-tour="intake"]',
    content: "New client applications appear here. Review intake forms and accept or decline potential clients.",
    placement: "right",
  },
  {
    target: '[data-tour="resources"]',
    content: "Upload and share resources with your clients - documents, worksheets, videos, and more.",
    placement: "right",
  },
  {
    target: '[data-tour="billing"]',
    content: "Manage invoices, track payments, and view your revenue. You can connect Stripe or PayPal for payments.",
    placement: "right",
  },
  {
    target: '[data-tour="analytics"]',
    content: "Get insights into your coaching practice with metrics on clients, sessions, revenue, and engagement.",
    placement: "right",
  },
];

const CLIENT_STEPS: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    content: "Welcome to your coaching portal! Here's your personal dashboard showing upcoming sessions and action items.",
    disableBeacon: true,
    placement: "center",
  },
  {
    target: '[data-tour="sessions"]',
    content: "View and manage your coaching sessions. You can see scheduled sessions, join meetings, and review past sessions.",
    placement: "right",
  },
  {
    target: '[data-tour="actions"]',
    content: "Track your action items and goals. Mark items complete as you progress through your coaching journey.",
    placement: "right",
  },
  {
    target: '[data-tour="resources"]',
    content: "Access resources shared by your coach - articles, worksheets, videos, and other materials.",
    placement: "right",
  },
  {
    target: '[data-tour="profile"]',
    content: "Update your profile, manage notification preferences, and connect your calendar.",
    placement: "right",
  },
];

export function OnboardingTour({ role, tourCompleted }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const queryClient = useQueryClient();

  const steps = role === "coach" ? COACH_STEPS : CLIENT_STEPS;

  // Disabled auto-start: Joyride was causing a white screen when it attached
  // (e.g. portal/target issues). Tour can be started via RestartTourButton or
  // re-enabled here once targets and layout are verified.
  // useEffect(() => {
  //   if (tourCompleted === false) {
  //     const timer = setTimeout(() => setRun(true), 500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [tourCompleted]);

  const markTourCompleted = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/auth/user", { onboardingCompleted: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      markTourCompleted.mutate();
    }

    // Handle close button click
    if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
      setRun(false);
      markTourCompleted.mutate();
    }
  };

  // Only mount Joyride when run is true to avoid white screen from library init
  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3A5A6D",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "8px",
          fontSize: "14px",
        },
        buttonNext: {
          backgroundColor: "#3A5A6D",
          borderRadius: "6px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#3A5A6D",
          marginRight: "8px",
        },
        buttonSkip: {
          color: "#6b7280",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}

// Button to restart the tour
export function RestartTourButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Show tour
    </button>
  );
}
