import React from "react";
import { useApp } from "../../state/AppContext.js";
import { useKeyboard } from "../../hooks/useKeyboard.js";
import { ConfirmModal } from "./ConfirmModal.js";
import { InputModal } from "./InputModal.js";
import { SelectModal } from "./SelectModal.js";
import { MessageModal } from "./MessageModal.js";
import { LoadingModal } from "./LoadingModal.js";

/**
 * Container that renders the active modal as an overlay
 * Handles global Escape key to close modals
 */
export function ModalContainer() {
	const { state } = useApp();
	const { modal } = state;

	// Handle Escape key to close modal (except loading)
	useKeyboard((key) => {
		if (key.name === "escape" && modal && modal.type !== "loading") {
			// Loading modal cannot be dismissed with Escape
			if (modal.type === "confirm") {
				modal.onCancel();
			} else if (modal.type === "input") {
				modal.onCancel();
			} else if (modal.type === "select") {
				modal.onCancel();
			} else if (modal.type === "message") {
				modal.onDismiss();
			}
		}
	});

	if (!modal) {
		return null;
	}

	const renderModal = () => {
		switch (modal.type) {
			case "confirm":
				return (
					<ConfirmModal
						title={modal.title}
						message={modal.message}
						onConfirm={modal.onConfirm}
						onCancel={modal.onCancel}
					/>
				);

			case "input":
				return (
					<InputModal
						title={modal.title}
						label={modal.label}
						defaultValue={modal.defaultValue}
						onSubmit={modal.onSubmit}
						onCancel={modal.onCancel}
					/>
				);

			case "select":
				return (
					<SelectModal
						title={modal.title}
						message={modal.message}
						options={modal.options}
						onSelect={modal.onSelect}
						onCancel={modal.onCancel}
					/>
				);

			case "message":
				return (
					<MessageModal
						title={modal.title}
						message={modal.message}
						variant={modal.variant}
						onDismiss={modal.onDismiss}
					/>
				);

			case "loading":
				return <LoadingModal message={modal.message} />;

			default:
				return null;
		}
	};

	// Center the modal on screen
	return (
		<box
			position="absolute"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
		>
			{renderModal()}
		</box>
	);
}

export default ModalContainer;
