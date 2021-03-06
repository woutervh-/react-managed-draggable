import * as React from 'react';

if (!(window as any)['react-managed-draggable-style-injected']) {
    (window as any)['react-managed-draggable-style-injected'] = true;
    const styleElement = document.createElement('style');
    styleElement.innerHTML = '.react-managed-draggable-unselectable { user-select: none; }';
    document.body.appendChild(styleElement);
}

export interface XY {
    x: number;
    y: number;
}

interface Cancelable {
    cancel: () => void;
}

const rafThrottle = <T extends (...args: any[]) => any>(callback: T) => {
    let requestId: number | null;

    const later = (context: any, args: any[]) => () => {
        requestId = null;
        callback.apply(context, args);
    };

    const throttled: any = function (this: any, ...args: any[]) {
        if ((requestId === null) || (requestId === undefined)) {
            requestId = window.requestAnimationFrame(later(this, args));
        }
    };

    throttled.cancel = () => requestId !== null && window.cancelAnimationFrame(requestId);

    return throttled as T & Cancelable;
};

function manhattanDistance(p1: XY, p2: XY): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function getPosition(event: MouseEvent | TouchEvent): XY {
    if ('touches' in event) {
        if (event.touches.length >= 1) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        } else {
            return { x: 0, y: 0 };
        }
    } else {
        return { x: event.clientX, y: event.clientY };
    }
}

export interface DragInformation {
    current: XY;
    start: XY;
    last: XY;
}

export interface DragOptions {
    threshold?: number;
    onDragStart?: (event: MouseEvent | TouchEvent, dragPayload: DragInformation) => void;
    onDragMove?: (event: MouseEvent | TouchEvent, dragPayload: DragInformation) => void;
    onDragEnd?: (event: MouseEvent | TouchEvent | undefined, dragPayload: DragInformation) => void;
    onClick?: (event: MouseEvent | TouchEvent, dragPayload: DragInformation) => void;
}

export class ElementDraggable {
    private element: HTMLElement | SVGElement;
    private options: DragOptions;
    private immediate: boolean;
    private down: boolean = false;
    private dragging: boolean = false;
    private start: XY = { x: 0, y: 0 };
    private current: XY = { x: 0, y: 0 };

    public constructor(element: HTMLElement | SVGElement, options: DragOptions, immediate?: boolean) {
        this.element = element;
        this.options = options;
        this.immediate = !!immediate;
        if (immediate) {
            this.dragging = true;
            document.addEventListener('mousemove', this.handleMove);
            document.addEventListener('touchmove', this.handleMove);
            document.addEventListener('mouseup', this.handleUp);
            document.addEventListener('touchend', this.handleUp);
        } else {
            (element as HTMLElement).addEventListener('mousedown', this.handleDown);
            (element as HTMLElement).addEventListener('touchstart', this.handleDown);
        }
    }

    public destroy() {
        if (!this.immediate) {
            (this.element as HTMLElement).removeEventListener('mousedown', this.handleDown);
            (this.element as HTMLElement).removeEventListener('touchstart', this.handleDown);
        }
        if (this.down) {
            this.down = false;
            if (this.options.onDragEnd) {
                this.options.onDragEnd(undefined, this.generateDragInformation(this.current));
            }
            document.removeEventListener('mousemove', this.handleMove);
            document.removeEventListener('touchmove', this.handleMove);
            document.removeEventListener('mouseup', this.handleUp);
            document.removeEventListener('touchend', this.handleUp);
        }
        if (this.down || this.dragging) {
            document.body.classList.remove('react-managed-draggable-unselectable');
        }
    }

    private getThreshold() {
        return this.options.threshold === undefined ? 0 : this.options.threshold;
    }

    private handleDown = (event: MouseEvent | TouchEvent) => {
        if (!this.down && !this.dragging) {
            this.down = true;

            document.addEventListener('mousemove', this.handleMove);
            document.addEventListener('touchmove', this.handleMove);
            document.addEventListener('mouseup', this.handleUp);
            document.addEventListener('touchend', this.handleUp);
            document.body.classList.add('react-managed-draggable-unselectable');
            this.current = this.start = getPosition(event);

            if (this.getThreshold() <= 0) {
                this.dragging = true;
                if (this.options.onDragStart) {
                    this.options.onDragStart(event, this.generateDragInformation(this.current));
                }
                // event.stopPropagation();
                event.preventDefault();
            }
        }
    }

    private handleMove = rafThrottle((event: MouseEvent | TouchEvent) => {
        if (this.down || this.dragging) {
            const last = this.current;
            this.current = getPosition(event);
            if (this.dragging) {
                if (this.options.onDragMove) {
                    this.options.onDragMove(event, this.generateDragInformation(last));
                }
            } else {
                if (manhattanDistance(this.start, this.current) >= this.getThreshold()) {
                    this.dragging = true;
                    if (this.options.onDragStart) {
                        this.options.onDragStart(event, this.generateDragInformation(last));
                    }
                }
            }
        }
    });

    private handleUp = (event: MouseEvent | TouchEvent) => {
        if (this.down || this.dragging) {
            document.body.classList.remove('react-managed-draggable-unselectable');
            document.removeEventListener('mousemove', this.handleMove);
            document.removeEventListener('touchmove', this.handleMove);
            document.removeEventListener('mouseup', this.handleUp);
            document.removeEventListener('touchend', this.handleUp);

            if (this.dragging) {
                this.dragging = false;
                const last = this.current;
                // If touch is released, there are no event coordinates
                // this.current = getPosition(event);
                if (this.options.onDragEnd) {
                    this.options.onDragEnd(event, this.generateDragInformation(last));
                }
            } else if (this.down && this.options.onClick) {
                if ('touches' in event || event.button === 0) {
                    const last = this.current;
                    if (!('touches' in event)) {
                        this.current = getPosition(event);
                    }
                    this.options.onClick(event, this.generateDragInformation(last));
                }
            }

            this.down = false;
        }
    }

    private generateDragInformation(last: XY): DragInformation {
        return {
            current: this.current,
            start: this.start,
            last
        };
    }
}

export interface Props extends Pick<React.AllHTMLAttributes<HTMLDivElement>, Exclude<keyof React.AllHTMLAttributes<HTMLDivElement>, keyof DragOptions>>, DragOptions { }

export class Draggable extends React.Component<Props, never> {
    private element: HTMLDivElement | null = null;
    private draggable: ElementDraggable | null = null;

    public componentDidMount() {
        if (this.element !== null) {
            this.draggable = new ElementDraggable(this.element, {
                threshold: this.props.threshold,
                onDragStart: this.props.onDragStart,
                onDragMove: this.props.onDragMove,
                onDragEnd: this.props.onDragEnd,
                onClick: this.props.onClick
            });
        }
    }

    public componentWillUnmount() {
        if (this.draggable !== null) {
            this.draggable.destroy();
            this.draggable = null;
        }
    }

    public render() {
        const { children, threshold, onDragStart, onDragMove, onDragEnd, onClick, ...other } = this.props;
        return <div ref={(ref) => this.element = ref} {...other}>
            {children}
        </div>;
    }
}
